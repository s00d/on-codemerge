import type { DocNode, EditorState, JSONDoc } from '@codemerge/kernel';
import type { EditorAPI } from '@codemerge/sdk';
import { foreign, h, mount, downloadBlob, pickFile } from '@codemerge/sdk';
import type { MountHandle } from '@codemerge/sdk';
import { mountSourceEditor } from '@codemerge/editor';
import type { SourceEditorHandle } from '@codemerge/editor';
import { languageFromDoc, textFromDoc } from '../io/adapters';
import { MAX_CODE_BYTES, parseText, safeLangToken, serializeText } from '../io/text';

export type CodeWorkspaceHost = EditorAPI & {
  replaceDocument?(doc: DocNode | JSONDoc): void;
};

export type CodeWorkspaceHandle = {
  update(state: EditorState): void;
  destroy(): void;
  flushPendingSoT(): void;
  getText(): string;
  getLanguage(): string;
  setLanguage(language: string): void;
  copyAll(): void;
  selectAll(): void;
  clear(): void;
  indent(): void;
  outdent(): void;
  download(): void;
  upload(): void;
  focus(): void;
};

/** Lets apps/code `Editor.getText` flush debounce before reading SoT. */
export const codeWorkspaceByEditor = new WeakMap<object, CodeWorkspaceHandle>();

function replaceDoc(editor: CodeWorkspaceHost, doc: DocNode | JSONDoc): void {
  if (typeof editor.replaceDocument === 'function') {
    editor.replaceDocument(doc);
    return;
  }
  editor.setJSON(doc);
}

function lineCountOf(text: string): number {
  if (text.length === 0) {
    return 1;
  }
  let n = 1;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 10) {
      n += 1;
    }
  }
  return n;
}

export function mountCodeWorkspace(
  editor: CodeWorkspaceHost,
  contentHost: HTMLElement
): CodeWorkspaceHandle {
  contentHost.classList.add('ocm-code-root');

  let source: SourceEditorHandle | null = null;
  let shellHandle: MountHandle | null = null;
  let statusHandle: MountHandle | null = null;
  let langInput: HTMLInputElement | null = null;
  let linesEl: HTMLElement | null = null;
  let charsEl: HTMLElement | null = null;
  let language = languageFromDoc(editor.getState().doc);
  let suppress = false;
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const paintCounts = (text: string): void => {
    if (linesEl) {
      linesEl.replaceChildren(`${lineCountOf(text)} lines`);
    }
    if (charsEl) {
      charsEl.replaceChildren(`${text.length} chars`);
    }
  };

  const syncLangInput = (): void => {
    if (!langInput || document.activeElement === langInput) {
      return;
    }
    langInput.value = language;
  };

  const bindStatusRefs = (): void => {
    const lang = statusHandle?.refs.lang;
    langInput = lang instanceof HTMLInputElement ? lang : null;
    const lines = statusHandle?.refs.lines;
    linesEl = lines instanceof HTMLElement ? lines : null;
    const chars = statusHandle?.refs.chars;
    charsEl = chars instanceof HTMLElement ? chars : null;
  };

  const paintStatus = (): void => {
    const statusEl = shellHandle?.refs.status;
    if (!(statusEl instanceof HTMLElement)) {
      return;
    }
    const text = source?.getText() ?? textFromDoc(editor.getState().doc);
    if (statusHandle && langInput && linesEl && charsEl) {
      paintCounts(text);
      syncLangInput();
      return;
    }
    statusHandle?.destroy();
    statusHandle = mount(
      statusEl,
      h(
        'div',
        { class: 'ocm-code-status__inner flex items-center gap-3 text-xs text-ocm-text-muted' },
        [
          h('label', { class: 'flex items-center gap-1' }, [
            'Lang',
            h('input', {
              ref: 'lang',
              class:
                'ocm-code-status__lang rounded-ocm-sm border border-ocm-border bg-ocm-input px-1.5 py-0.5 font-mono text-xs',
              attrs: { type: 'text', 'aria-label': 'Language metadata' },
              props: { value: language },
              on: {
                change: (e) => {
                  const el = e.target;
                  if (el instanceof HTMLInputElement) {
                    setLanguage(el.value.trim() || 'plaintext');
                  }
                },
              },
            }),
          ]),
          h('span', { ref: 'lines' }, `${lineCountOf(text)} lines`),
          h('span', { ref: 'chars' }, `${text.length} chars`),
        ]
      )
    );
    bindStatusRefs();
  };

  const commitSoT = (text: string): void => {
    const result = parseText(text, language);
    if (!result.ok) {
      editor.notify(result.error.message);
      return;
    }
    suppress = true;
    replaceDoc(editor, result.doc);
    suppress = false;
  };

  const flushPendingSoT = (): void => {
    if (!debounce) {
      return;
    }
    clearTimeout(debounce);
    debounce = null;
    commitSoT(source?.getText() ?? '');
    paintStatus();
  };

  const clearDebounce = (): void => {
    if (debounce) {
      clearTimeout(debounce);
      debounce = null;
    }
  };

  const onDocChanged = (): void => {
    if (debounce) {
      clearTimeout(debounce);
    }
    debounce = setTimeout(() => {
      debounce = null;
      commitSoT(source?.getText() ?? '');
      paintStatus();
    }, 200);
  };

  const setLanguage = (next: string): void => {
    language = next || 'plaintext';
    clearDebounce();
    commitSoT(source?.getText() ?? '');
    paintStatus();
  };

  shellHandle = mount(
    contentHost,
    h('div', { class: 'ocm-code-shell flex h-full min-h-0 flex-1 flex-col' }, [
      foreign((host, scope) => {
        host.classList.add('ocm-code-source-host', 'flex', 'min-h-0', 'flex-1', 'flex-col');
        source = mountSourceEditor(host, {
          initialText: textFromDoc(editor.getState().doc),
          onDocChanged,
        });
        scope.disposable(() => {
          source?.destroy();
          source = null;
        });
      }),
      h('div', {
        ref: 'status',
        class:
          'ocm-code-status shrink-0 border-t border-ocm-border bg-ocm-surface-muted/30 px-2 py-1',
      }),
    ])
  );

  paintStatus();

  const handle: CodeWorkspaceHandle = {
    update(state) {
      if (suppress) {
        return;
      }
      clearDebounce();
      const nextText = serializeText(state.doc);
      const nextLang = languageFromDoc(state.doc);
      language = nextLang;
      if (source && source.getText() !== nextText) {
        source.setText(nextText, { caret: 'preserve' });
      }
      paintStatus();
    },
    flushPendingSoT,
    destroy() {
      flushPendingSoT();
      codeWorkspaceByEditor.delete(editor);
      statusHandle?.destroy();
      statusHandle = null;
      langInput = null;
      linesEl = null;
      charsEl = null;
      shellHandle?.destroy();
      shellHandle = null;
      source = null;
      contentHost.replaceChildren();
      contentHost.classList.remove('ocm-code-root');
    },
    getText: () => source?.getText() ?? textFromDoc(editor.getState().doc),
    getLanguage: () => language,
    setLanguage,
    copyAll() {
      const text = source?.getText() ?? '';
      void (async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          editor.notify('Clipboard unavailable');
        }
      })();
    },
    selectAll() {
      const ta = source?.scrollDOM;
      if (ta instanceof HTMLTextAreaElement) {
        ta.focus();
        ta.select();
      }
    },
    clear() {
      clearDebounce();
      source?.replaceText('');
      commitSoT('');
      paintStatus();
    },
    indent() {
      const ta = source?.scrollDOM;
      if (!(ta instanceof HTMLTextAreaElement)) {
        return;
      }
      ta.focus();
      ta.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      );
    },
    outdent() {
      const ta = source?.scrollDOM;
      if (!(ta instanceof HTMLTextAreaElement)) {
        return;
      }
      ta.focus();
      ta.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        })
      );
    },
    download() {
      const tok = safeLangToken(language);
      const name = `code.${tok === 'plaintext' ? 'txt' : tok}`;
      downloadBlob(source?.getText() ?? '', name, 'text/plain;charset=utf-8');
    },
    upload() {
      void (async () => {
        const files = await pickFile({
          accept: '.txt,.md,.js,.ts,.json,.css,.html,.py,.rs,.go,*/*',
        });
        const file = files?.[0];
        if (!file) {
          return;
        }
        if (file.size > MAX_CODE_BYTES) {
          editor.notify(`Code exceeds ${MAX_CODE_BYTES} bytes`);
          return;
        }
        const text = await file.text();
        const result = parseText(text, language);
        if (!result.ok) {
          editor.notify(result.error.message);
          return;
        }
        clearDebounce();
        source?.setText(text);
        replaceDoc(editor, result.doc);
        paintStatus();
      })();
    },
    focus() {
      source?.focus();
    },
  };

  codeWorkspaceByEditor.set(editor, handle);
  return handle;
}
