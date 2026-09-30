import { h, mount } from '@codemerge/sdk';
import type { MountHandle } from '@codemerge/sdk';
import { mountSourceEditor } from '@codemerge/editor';
import type { SourceEditorHandle } from '@codemerge/editor';
import { jsonTextPreflight } from '../io/text';

export type RawEditorHandle = {
  getText(): string;
  setText(text: string): void;
  focus(): void;
  destroy(): void;
  readonly dom: HTMLElement;
};

export type RawEditorOptions = {
  initialText: string;
  onDirty(): void;
  /** Mod-s / explicit apply request from keymap. */
  onApplyRequest(): void;
};

type LintDiag = { from: number; to: number; message: string };

function lintJson(text: string): LintDiag[] {
  const pre = jsonTextPreflight(text);
  if (pre.ok) {
    return [];
  }
  const from = Math.max(0, Math.min(pre.error.offset ?? 0, Math.max(text.length, 0)));
  const to = text.length === 0 ? 0 : Math.min(text.length, from + 1);
  return [{ from, to, message: pre.error.message }];
}

/**
 * Mount JSON source editor into a stable host (never remount via ViewSpec paint).
 * SoT writes must go through workspace `parseText` — this module never calls replaceDocument.
 */
export function mountRawEditor(host: HTMLElement, options: RawEditorOptions): RawEditorHandle {
  host.replaceChildren();

  let source: SourceEditorHandle | null = null;
  let lintMount: MountHandle | null = null;
  let lintHost: HTMLElement | null = null;

  const paintLint = (text: string): void => {
    if (!lintHost) {
      return;
    }
    const diags = lintJson(text);
    lintMount?.destroy();
    lintMount = null;
    if (diags.length === 0) {
      lintHost.replaceChildren();
      return;
    }
    const d = diags.at(0);
    if (d === undefined) {
      return;
    }
    lintMount = mount(
      lintHost,
      h(
        'div',
        {
          class:
            'ocm-source-lint border-t border-ocm-border bg-ocm-surface-muted/50 px-2 py-1 text-xs text-red-600',
          attrs: { role: 'status' },
        },
        d.message
      )
    );
  };

  // flex-1 (not only h-full): absolute mirror/textarea do not size the slot — flex must.
  const shell = mount(
    host,
    h('div', { class: 'ocm-json-source-shell flex h-full min-h-0 flex-1 flex-col' }, [
      h('div', {
        class: 'ocm-json-source-editor-slot flex min-h-0 flex-1 flex-col',
        ref: 'editor',
      }),
      h('div', { class: 'ocm-json-source-lint-slot shrink-0', ref: 'lint' }),
    ])
  );

  const editorHost = shell.refs.editor;
  lintHost = shell.refs.lint;

  source = mountSourceEditor(editorHost, {
    initialText: options.initialText,
    onDocChanged: () => {
      paintLint(source?.getText() ?? '');
      options.onDirty();
    },
    onApplyRequest: () => {
      options.onApplyRequest();
    },
  });
  paintLint(options.initialText);

  return {
    dom: host,
    getText() {
      return source?.getText() ?? '';
    },
    setText(text: string) {
      source?.setText(text);
      paintLint(text);
    },
    focus() {
      source?.focus();
    },
    destroy() {
      source?.destroy();
      source = null;
      lintMount?.destroy();
      lintMount = null;
      shell.destroy();
      lintHost = null;
      host.replaceChildren();
    },
  };
}
