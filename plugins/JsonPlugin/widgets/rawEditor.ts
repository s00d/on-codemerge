import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { defaultKeymap } from '@codemirror/commands';

/** Match parseText byte cap — skip uncapped JSON.parse in the linter. */
export const CM_MAX_JSON_BYTES = 1_000_000;

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

function sizeAwareJsonLinter() {
  return linter((view) => {
    const text = view.state.doc.toString();
    if (text.length > CM_MAX_JSON_BYTES) {
      return [
        {
          from: 0,
          to: Math.min(text.length, 1),
          severity: 'error',
          message: `JSON exceeds ${CM_MAX_JSON_BYTES} bytes`,
        } satisfies Diagnostic,
      ];
    }
    try {
      JSON.parse(text);
      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON';
      let from = 0;
      let to = Math.min(text.length, 1);
      const match = /position\s+(\d+)/i.exec(message);
      if (match) {
        const pos = Number(match[1]);
        if (Number.isFinite(pos)) {
          from = Math.max(0, Math.min(pos, text.length));
          to = Math.min(text.length, from + 1);
        }
      }
      return [{ from, to, severity: 'error', message } satisfies Diagnostic];
    }
  });
}

/**
 * Mount CodeMirror 6 JSON editor into a stable host (never remount via ViewSpec paint).
 * SoT writes must go through workspace `parseText` — this module never calls replaceDocument.
 */
export function mountRawEditor(host: HTMLElement, options: RawEditorOptions): RawEditorHandle {
  host.classList.add('ocm-json-cm');
  host.replaceChildren();

  let suppressDirty = false;

  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: options.initialText,
      extensions: [
        basicSetup,
        json(),
        lintGutter(),
        sizeAwareJsonLinter(),
        keymap.of([
          ...defaultKeymap,
          {
            key: 'Mod-s',
            run: () => {
              options.onApplyRequest();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !suppressDirty) {
            options.onDirty();
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
            backgroundColor: 'var(--color-ocm-surface, #fff)',
            color: 'var(--color-ocm-text, #18181b)',
          },
          '.cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            padding: '0',
          },
          '.cm-content': { padding: '0', caretColor: 'currentColor' },
          '.cm-gutters': {
            paddingRight: '4px',
            border: 'none',
            backgroundColor: 'var(--color-ocm-surface-muted, #fafafa)',
            color: 'var(--color-ocm-text-muted, #71717a)',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'var(--color-ocm-surface-hover, #f4f4f5)',
          },
          '.cm-activeLine': {
            backgroundColor: 'var(--color-ocm-surface-hover, #f4f4f5)',
          },
          '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
            backgroundColor: 'var(--color-ocm-accent-soft, #e0f2fe) !important',
          },
          '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: 'var(--color-ocm-text, #18181b)',
          },
          '.cm-line': { padding: '0 0 0 4px' },
          '&.cm-focused': { outline: 'none' },
        }),
      ],
    }),
  });

  return {
    dom: host,
    getText() {
      return view.state.doc.toString();
    },
    setText(text: string) {
      const cur = view.state.doc.toString();
      if (cur === text) {
        return;
      }
      suppressDirty = true;
      try {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: text },
        });
      } finally {
        suppressDirty = false;
      }
    },
    focus() {
      view.focus();
    },
    destroy() {
      view.destroy();
      host.replaceChildren();
      host.classList.remove('ocm-json-cm');
    },
  };
}
