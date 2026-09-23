import { PopupController, foreign, h, mount, renderDetached } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { MathRenderer } from '../services/MathRenderer';
import type { MathExpression } from '../types';
import { MATH_TEMPLATES } from '../constants/templates';
import { mathBuildPanel, insertWithHoles } from './MathBuildPanel';
import { pathFromEl } from '../../../utils/atomPath';

type EditorMode = 'build' | 'source';

/**
 * Math insert/edit — ChartMenu analog: templates + Build/Source + live MathML preview.
 */
export class MathMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly renderer: MathRenderer;
  private onInsert: ((element: HTMLElement) => void) | null = null;
  private editingHost: HTMLElement | null = null;
  private editingContainer: HTMLElement | null = null;
  private expressionInput: HTMLTextAreaElement | null = null;
  private previewHost: HTMLElement | null = null;
  private expression = '';
  private mode: EditorMode = 'build';
  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.renderer = new MathRenderer();
  }

  private readonly t = (k: string): string => this.editor.t(k) || k;

  private schedulePreview(value: string): void {
    this.expression = value;
    if (this.previewTimer) {
      globalThis.clearTimeout(this.previewTimer);
    }
    this.previewTimer = globalThis.setTimeout(() => {
      this.updatePreview(value);
    }, 100);
  }

  private updatePreview(expression: MathExpression): void {
    if (!this.previewHost) {
      return;
    }
    if (!expression.trim()) {
      mount(this.previewHost, this.t('math.mathPreviewWillAppearHere'));
      return;
    }
    const canvas = this.renderer.renderMath(expression, { width: 400, height: 120 });
    this.previewHost.replaceChildren(canvas);
  }

  private insertTemplate(template: string): void {
    const input = this.expressionInput;
    if (!input) {
      this.expression += template.replaceAll('#', '');
      this.schedulePreview(this.expression);
      return;
    }
    const cursor = input.selectionStart ?? input.value.length;
    const next = insertWithHoles(input.value, cursor, template);
    input.value = next.value;
    this.expression = next.value;
    input.focus();
    input.setSelectionRange(next.start, next.end);
    this.schedulePreview(next.value);
  }

  private setMode(mode: EditorMode): void {
    this.mode = mode;
    // Remount via reopening is heavy; patch body by updating open popup is hard.
    // Store mode and reopen current dialog content by closing/reopening is bad UX.
    // Instead: keep both panels, toggle hidden via remount of view — simplest: reopen with same state.
    const editingHost = this.editingHost;
    const editingContainer = this.editingContainer;
    const onInsert = this.onInsert;
    const expr = this.expression;
    this.popups.close();
    this.expression = expr;
    this.editingHost = editingHost;
    this.editingContainer = editingContainer;
    this.onInsert = onInsert;
    this.open();
  }

  private templatesRow(): ViewSpec {
    return h(
      'div',
      { class: 'flex flex-wrap gap-1 mb-3' },
      ...MATH_TEMPLATES.map((tpl) =>
        h(
          'button',
          {
            class:
              'rounded-full border border-ocm-border px-2.5 py-1 text-xs text-ocm-text hover:bg-ocm-surface-hover',
            attrs: { type: 'button', title: tpl.expression },
            on: {
              click: () => {
                this.expression = tpl.expression;
                if (this.expressionInput) {
                  this.expressionInput.value = tpl.expression;
                }
                this.schedulePreview(tpl.expression);
              },
            },
          },
          tpl.name
        )
      )
    );
  }

  private modeToggle(): ViewSpec {
    const btn = (mode: EditorMode, label: string) =>
      h(
        'button',
        {
          class: `rounded px-3 py-1 text-sm ${
            this.mode === mode
              ? 'bg-ocm-accent text-white'
              : 'border border-ocm-border text-ocm-text hover:bg-ocm-surface-hover'
          }`,
          attrs: { type: 'button' },
          on: {
            click: () => {
              if (this.mode !== mode) {
                this.setMode(mode);
              }
            },
          },
        },
        label
      );
    return h('div', { class: 'flex gap-2 mb-3' }, [
      btn('build', this.t('math.modeBuild') || 'Build'),
      btn('source', this.t('math.modeSource') || 'Source'),
    ]);
  }

  private expressionField(): ViewSpec {
    return foreign((host, scope) => {
      const handle = mount(
        host,
        h('textarea', {
          class:
            'math-input w-full min-h-24 rounded-md border border-ocm-border bg-ocm-input p-2 font-mono text-sm text-ocm-text focus:outline-none focus:ring-2 focus:ring-ocm-accent',
          attrs: {
            id: 'math-expression',
            placeholder: this.t('math.enterYourMathExpressionHere') || '',
            rows: this.mode === 'source' ? 8 : 3,
          },
          props: { value: this.expression },
          on: {
            input: (e) => {
              const t = e.target;
              if (!(t instanceof HTMLTextAreaElement)) {
                return;
              }
              this.schedulePreview(t.value);
            },
          },
        })
      );
      this.expressionInput = host.querySelector('textarea');
      scope.own(handle);
      scope.disposable(() => {
        this.expressionInput = null;
      });
    });
  }

  private editorView(): ViewSpec {
    const children: ViewSpec[] = [
      this.templatesRow(),
      this.modeToggle(),
      this.mode === 'build'
        ? mathBuildPanel((tpl) => {
            this.insertTemplate(tpl);
          }, this.t)
        : null,
      h('label', { class: 'mt-2 block text-sm font-medium', attrs: { for: 'math-expression' } }, [
        this.mode === 'source'
          ? this.t('math.mathExpressionLatex')
          : this.t('math.expression') || 'Expression',
      ]),
      this.expressionField(),
      foreign(
        (host, scope) => {
          host.className =
            'preview-math-container mt-4 flex min-h-40 items-center justify-center rounded-lg border border-ocm-border bg-ocm-surface-muted p-3';
          host.textContent = this.t('math.mathPreviewWillAppearHere');
          this.previewHost = host;
          scope.disposable(() => {
            if (this.previewHost === host) {
              this.previewHost = null;
            }
          });
          if (this.expression) {
            this.updatePreview(this.expression);
          }
        },
        { key: 'math-preview' }
      ),
    ];
    return h('div', { class: 'math-menu-body flex flex-col gap-1 p-1' }, children);
  }

  private open(): void {
    this.popups.open({
      title: this.editingHost ? this.t('common.edit') : this.t('math.insert'),
      className: 'math-menu',
      size: 'md',
      closeOnClickOutside: true,
      items: [{ type: 'view', id: 'math-editor', view: () => this.editorView() }],
      buttons: [
        {
          label: this.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: this.editingHost ? this.t('common.apply') : this.t('common.insert'),
          variant: 'primary',
          onClick: () => {
            this.handleSubmit();
            return true;
          },
        },
      ],
    });
  }

  private handleSubmit(): void {
    const expression = (this.expressionInput?.value ?? this.expression).trim();
    if (!expression) {
      return;
    }
    this.expression = expression;

    if (this.editingHost && this.editingContainer) {
      const path = pathFromEl(this.editingHost);
      if (path) {
        this.editor.run(() => [
          {
            type: 'set_attrs',
            path,
            attrs: { expression },
          },
        ]);
      }
      this.editingContainer.dataset.mathExpression = expression;
      const w = this.editingContainer.clientWidth;
      const height = this.editingContainer.clientHeight;
      const canvas = this.renderer.renderMath(
        expression,
        w > 0 && height > 0 ? { width: w, height } : {}
      );
      this.editingContainer.replaceChildren(canvas);
    } else {
      const { el: mathContainer } = renderDetached(
        h('div', {
          class: 'math-container',
          style: { width: 'fit-content', maxWidth: '100%', height: 'auto' },
          attrs: { 'data-math-expression': expression },
        })
      );
      mathContainer.append(this.renderer.renderMath(expression));
      this.onInsert?.(mathContainer);
    }
    this.popups.close();
  }

  public show(onInsert: (element: HTMLElement) => void): void {
    this.editingHost = null;
    this.editingContainer = null;
    this.onInsert = onInsert;
    this.expression = '';
    this.mode = 'build';
    this.open();
  }

  public edit(atomHost: HTMLElement, mathContainer: HTMLElement): void {
    this.onInsert = null;
    this.editingHost = atomHost;
    this.editingContainer = mathContainer;
    this.expression = mathContainer.dataset.mathExpression ?? '';
    this.mode = 'source';
    this.open();
  }

  public redrawMath(
    container: HTMLElement,
    expression: MathExpression,
    dimensions: { width: number; height: number }
  ): void {
    const canvas = this.renderer.renderMath(expression, dimensions);
    container.replaceChildren(canvas);
  }
}
