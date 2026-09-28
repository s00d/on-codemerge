import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap } from '@codemirror/commands';

export type MdEditorHandle = {
  getText(): string;
  setText(text: string, opts?: { caret?: 'preserve' | 'end' }): void;
  /** Insert at cursor (or replace selection). */
  insertAtCursor(text: string): void;
  /** Wrap selection (or insert before+after at cursor). */
  wrapSelection(before: string, after: string): void;
  /** Replace full doc and optionally restore cursor. */
  replaceText(text: string, cursor?: number): void;
  getCursor(): number;
  getSelection(): { from: number; to: number };
  focus(): void;
  destroy(): void;
  readonly dom: HTMLElement;
  /** CM scroll container — for dual-pane proportional sync. */
  readonly scrollDOM: HTMLElement;
};

export type MdEditorOptions = {
  initialText: string;
  onDocChanged(): void;
  /** Mod-s — Apply request (atom dirty commit). */
  onApplyRequest?: () => void;
};

/**
 * CodeMirror 6 Markdown editor into a stable host (never remount via ViewSpec paint).
 */
export function mountMdEditor(host: HTMLElement, options: MdEditorOptions): MdEditorHandle {
  host.classList.add('ocm-md-cm');
  host.replaceChildren();

  let suppress = false;

  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: options.initialText,
      extensions: [
        basicSetup,
        markdown(),
        keymap.of([
          ...defaultKeymap,
          ...(options.onApplyRequest
            ? [
                {
                  key: 'Mod-s',
                  run: () => {
                    options.onApplyRequest?.();
                    return true;
                  },
                },
              ]
            : []),
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !suppress) {
            options.onDocChanged();
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
            backgroundColor: 'var(--color-ocm-surface, #fff)',
            color: 'var(--color-ocm-text, #18181b)',
          },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
          '&.cm-focused': { outline: 'none' },
        }),
      ],
    }),
  });

  const notify = (): void => {
    if (!suppress) {
      options.onDocChanged();
    }
  };

  return {
    getText: () => view.state.doc.toString(),
    setText: (text: string, opts) => {
      const cur = view.state.doc.toString();
      if (cur === text) {
        return;
      }
      const head = view.state.selection.main.head;
      const pos = opts?.caret === 'end' ? text.length : Math.max(0, Math.min(head, text.length));
      suppress = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
        selection: { anchor: pos },
      });
      suppress = false;
    },
    insertAtCursor: (text: string) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
    },
    wrapSelection: (before: string, after: string) => {
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      const insert = `${before}${selected}${after}`;
      view.dispatch({
        changes: { from, to, insert },
        selection: {
          anchor: from + before.length,
          head: from + before.length + selected.length,
        },
      });
    },
    replaceText: (text: string, cursor?: number) => {
      suppress = true;
      const pos = cursor === undefined ? text.length : Math.max(0, Math.min(cursor, text.length));
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
        selection: { anchor: pos },
      });
      suppress = false;
      notify();
    },
    getCursor: () => view.state.selection.main.head,
    getSelection: () => {
      const { from, to } = view.state.selection.main;
      return { from, to };
    },
    focus: () => {
      view.focus();
    },
    destroy: () => {
      view.destroy();
    },
    dom: view.dom,
    scrollDOM: view.scrollDOM,
  };
}
