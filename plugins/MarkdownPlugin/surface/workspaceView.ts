import type { DocNode, EditorState, JSONDoc, Operation } from '@on-codemerge/kernel';
import type { EditorAPI } from '@on-codemerge/sdk';
import { foreign, h, mount } from '@on-codemerge/sdk';
import type { MountHandle } from '@on-codemerge/sdk';
import { replaceChildrenWithSafeHtml } from '@ocm/wysiwyg/utils/safeHtml';
import { defaultMdElementRegistry } from '../elements/registry';
import type { MdElementRegistry } from '../elements/types';
import { docToText, emptyEditorDoc, parseText } from '../io';
import { projectPreviewHtml } from '../io/projectPreview';
import { mountMdEditor } from '../widgets/mdEditor';
import type { MdEditorHandle } from '../widgets/mdEditor';
import { hydrateMermaidBlocks } from '../widgets/mermaidHydrate';

export type MdWorkspaceHost = EditorAPI & {
  replaceDocument?(doc: DocNode | JSONDoc): void;
};

export type MdWorkspaceOptions = {
  /**
   * When true (atom embed): left pane is a dirty draft; SoT/parent commit only via Apply.
   * When false (shell app): left pane writes SoT live (debounce).
   */
  dirtyDraft?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onApply?: () => void;
  onDiscard?: () => void;
  /** Custom + builtin element registry for preview render. */
  elements?: MdElementRegistry;
};

export type MdWorkspaceHandle = {
  update(state: EditorState): void;
  destroy(): void;
  applyDraft(): boolean;
  discardDraft(): void;
  isDirty(): boolean;
  getDraftText(): string;
  getCursor(): number;
  getSelection(): { from: number; to: number };
  insertAtCursor(text: string): void;
  replaceText(text: string, cursor?: number): void;
  focus(): void;
  /** Flush pending CM→SoT debounce before kernel toolbar ops. */
  flushPendingSoT(): void;
};

function replaceDoc(editor: MdWorkspaceHost, doc: DocNode | JSONDoc): void {
  if (typeof editor.replaceDocument === 'function') {
    editor.replaceDocument(doc);
    return;
  }
  editor.setJSON(doc);
}

/** History-preserving full content swap (avoids replaceDocument → history.clear). */
function commitProseDoc(editor: MdWorkspaceHost, next: DocNode): boolean {
  const prev = editor.getState().doc;
  const oldLen = prev.content?.length ?? 0;
  const kids = next.content ?? [];
  return editor.run(() => {
    const ops: Operation[] = [];
    for (let i = oldLen - 1; i >= 0; i -= 1) {
      ops.push({ type: 'remove_node', path: [], index: i });
    }
    for (let i = 0; i < kids.length; i += 1) {
      const node = kids[i];
      if (node !== undefined) {
        ops.push({ type: 'insert_node', path: [], index: i, node });
      }
    }
    return ops;
  });
}

/** Max scrollable distance; 0 when content fits the viewport. */
function scrollMax(el: HTMLElement): number {
  return Math.max(0, el.scrollHeight - el.clientHeight);
}

function applyScrollRatio(el: HTMLElement, ratio: number): void {
  const max = scrollMax(el);
  el.scrollTop = max <= 0 ? 0 : Math.round(Math.min(1, Math.max(0, ratio)) * max);
}

function scrollRatio(el: HTMLElement): number {
  const max = scrollMax(el);
  return max <= 0 ? 0 : el.scrollTop / max;
}

type ScrollSync = {
  unbind(): void;
  alignPreviewToEditor(): void;
};

function bindProportionalScroll(editor: HTMLElement, preview: HTMLElement): ScrollSync {
  let lock: 'editor' | 'preview' | null = null;

  const sync = (from: HTMLElement, to: HTMLElement, side: 'editor' | 'preview'): void => {
    if (lock && lock !== side) {
      return;
    }
    const next = Math.round(scrollRatio(from) * scrollMax(to));
    if (Math.abs(to.scrollTop - next) < 1) {
      return;
    }
    lock = side;
    to.scrollTop = next;
    requestAnimationFrame(() => {
      if (lock === side) {
        lock = null;
      }
    });
  };

  const onEditor = (): void => sync(editor, preview, 'editor');
  const onPreview = (): void => sync(preview, editor, 'preview');
  editor.addEventListener('scroll', onEditor, { passive: true });
  preview.addEventListener('scroll', onPreview, { passive: true });

  return {
    unbind: () => {
      editor.removeEventListener('scroll', onEditor);
      preview.removeEventListener('scroll', onPreview);
    },
    alignPreviewToEditor: () => {
      lock = 'editor';
      applyScrollRatio(preview, scrollRatio(editor));
      requestAnimationFrame(() => {
        if (lock === 'editor') {
          lock = null;
        }
      });
    },
  };
}

async function paintPreviewFromDoc(
  slot: HTMLElement,
  doc: DocNode,
  elements: MdElementRegistry,
  sync?: ScrollSync | null,
  hydrateCtl?: { abort: AbortController | null; set: (next: AbortController) => void }
): Promise<void> {
  const html = projectPreviewHtml(doc, { elements });
  const pendingHosts = slot.querySelector(
    'div[data-node="mermaid"]:not([data-ocm-mermaid-ready]), .ocm-md-mermaid:not([data-ocm-mermaid-ready])'
  );
  // Skip DOM thrash only when projector output + hydrate are both settled.
  if (slot.getAttribute('data-ocm-preview-html') === html && !pendingHosts) {
    return;
  }
  hydrateCtl?.abort?.abort();
  const ac = new AbortController();
  hydrateCtl?.set(ac);
  slot.setAttribute('data-ocm-preview-html', html);
  replaceChildrenWithSafeHtml(slot, html);
  requestAnimationFrame(() => {
    if (!ac.signal.aborted) {
      sync?.alignPreviewToEditor();
    }
  });
  await hydrateMermaidBlocks(slot, { signal: ac.signal });
  if (ac.signal.aborted) {
    // Allow a later paint with the same HTML to retry hydrate.
    slot.removeAttribute('data-ocm-preview-html');
    return;
  }
  sync?.alignPreviewToEditor();
}

export function mountMdWorkspace(
  editor: MdWorkspaceHost,
  contentHost: HTMLElement,
  options: MdWorkspaceOptions = {}
): MdWorkspaceHandle {
  const dirtyDraft = options.dirtyDraft === true;
  const elements = options.elements ?? defaultMdElementRegistry;
  contentHost.classList.add('ocm-md-root');

  let dirty = false;
  let lastSoTMd = docToText(editor.getState().doc);
  let sotTimer: ReturnType<typeof setTimeout> | null = null;
  let draftPreviewTimer: ReturnType<typeof setTimeout> | null = null;
  let shellHandle: MountHandle | null = null;
  let mdHandle: MdEditorHandle | null = null;
  let scrollSync: ScrollSync | null = null;
  let hydrateAbort: AbortController | null = null;
  const hydrateCtl = {
    get abort() {
      return hydrateAbort;
    },
    set(next: AbortController) {
      hydrateAbort = next;
    },
  };

  const setDirty = (next: boolean): void => {
    if (dirty === next) {
      return;
    }
    dirty = next;
    contentHost.toggleAttribute('data-ocm-md-dirty', dirty);
    options.onDirtyChange?.(dirty);
    paintStatus();
  };

  const paintStatus = (): void => {
    const slot = shellHandle?.refs.status;
    if (!(slot instanceof HTMLElement)) {
      return;
    }
    const label = dirty ? 'Draft dirty — Apply or Discard' : 'SoT synced';
    const syncClass = dirty ? 'text-amber-600' : 'text-ocm-text-muted';
    const actions = dirtyDraft
      ? [
          h(
            'button',
            {
              class:
                'rounded-ocm-sm border border-ocm-border px-2 py-0.5 text-[11px] font-medium text-ocm-text hover:bg-ocm-surface-hover disabled:opacity-40',
              attrs: { type: 'button', ...(dirty ? {} : { disabled: 'true' }) },
              on: {
                click: (ev) => {
                  ev.preventDefault();
                  discardDraft();
                },
              },
            },
            'Discard'
          ),
          h(
            'button',
            {
              class:
                'rounded-ocm-sm border border-ocm-border bg-ocm-surface-muted px-2 py-0.5 text-[11px] font-medium text-ocm-text hover:bg-ocm-surface-hover disabled:opacity-40',
              attrs: { type: 'button', ...(dirty ? {} : { disabled: 'true' }) },
              on: {
                click: (ev) => {
                  ev.preventDefault();
                  applyDraft();
                },
              },
            },
            'Apply'
          ),
        ]
      : [];
    mount(
      slot,
      h('div', { class: 'flex flex-wrap items-center gap-2 text-[11px]' }, [
        h('span', { class: syncClass }, label),
        ...actions,
      ])
    );
  };

  const paintFromState = (state: EditorState): void => {
    const slot = shellHandle?.refs.preview;
    if (slot instanceof HTMLElement) {
      void paintPreviewFromDoc(slot, state.doc, elements, scrollSync, hydrateCtl);
    }
  };

  /** True while CM→SoT commit runs — update() must not rewrite CM (caret jump). */
  let applyingSoT = false;

  const commitLiveSoT = (text: string): void => {
    if (text === lastSoTMd) {
      return;
    }
    const parsed = parseText(text);
    if (!parsed.ok) {
      editor.notify(parsed.error.message);
      return;
    }
    applyingSoT = true;
    try {
      // Pre-arm echo guard before sync docChanged from commitProseDoc.
      lastSoTMd = docToText(parsed.doc);
      const ok = commitProseDoc(editor, parsed.doc);
      if (!ok) {
        return;
      }
      lastSoTMd = docToText(editor.getState().doc);
    } finally {
      applyingSoT = false;
    }
  };

  const scheduleLiveSoT = (text: string): void => {
    if (sotTimer) {
      clearTimeout(sotTimer);
    }
    sotTimer = setTimeout(() => {
      sotTimer = null;
      commitLiveSoT(text);
    }, 150);
  };

  const onEditorChanged = (): void => {
    const text = mdHandle?.getText() ?? '';
    if (dirtyDraft) {
      setDirty(text !== lastSoTMd);
      // Draft preview: debounce parse → projector (parent SoT untouched).
      if (draftPreviewTimer) {
        clearTimeout(draftPreviewTimer);
      }
      draftPreviewTimer = setTimeout(() => {
        draftPreviewTimer = null;
        const parsed = parseText(text);
        if (parsed.ok) {
          const slot = shellHandle?.refs.preview;
          if (slot instanceof HTMLElement) {
            void paintPreviewFromDoc(slot, parsed.doc, elements, scrollSync, hydrateCtl);
          }
        }
      }, 120);
      return;
    }
    scheduleLiveSoT(text);
  };

  const applyDraft = (): boolean => {
    const text = mdHandle?.getText() ?? '';
    const parsed = parseText(text);
    if (!parsed.ok) {
      editor.notify(parsed.error.message);
      return false;
    }
    lastSoTMd = text;
    replaceDoc(editor, parsed.doc);
    setDirty(false);
    options.onApply?.();
    return true;
  };

  const discardDraft = (): void => {
    mdHandle?.setText(lastSoTMd);
    paintFromState(editor.getState());
    setDirty(false);
    options.onDiscard?.();
  };

  shellHandle = mount(
    contentHost,
    h('div', { class: 'ocm-md-shell' }, [
      h('div', { class: 'ocm-md-panes' }, [
        foreign((host, scope) => {
          host.classList.add('ocm-md-pane', 'ocm-md-pane--editor', 'ocm-md-cm-host');
          mdHandle = mountMdEditor(host, {
            initialText: lastSoTMd,
            onDocChanged: onEditorChanged,
            onApplyRequest: dirtyDraft ? () => applyDraft() : undefined,
          });
          scope.disposable(() => {
            mdHandle?.destroy();
            mdHandle = null;
          });
        }),
        h('div', {
          ref: 'preview',
          class: 'ocm-md-pane ocm-md-pane--preview ocm-md-preview',
        }),
      ]),
      h('div', { ref: 'status', class: 'ocm-md-status' }),
    ])
  );

  const previewSlot = shellHandle.refs.preview;
  const cmScroll = contentHost.querySelector('.cm-scroller');
  if (cmScroll instanceof HTMLElement && previewSlot instanceof HTMLElement) {
    scrollSync = bindProportionalScroll(cmScroll, previewSlot);
  }
  paintFromState(editor.getState());
  paintStatus();

  return {
    update(state: EditorState): void {
      const nextMd = docToText(state.doc);
      if (dirtyDraft && dirty) {
        return;
      }

      // Own CM→SoT commit echo: preview only — never rewrite the source pane.
      if (applyingSoT) {
        lastSoTMd = nextMd;
        paintFromState(state);
        return;
      }

      if (!dirtyDraft && sotTimer && nextMd === lastSoTMd) {
        // Debounce still owns the next CM→SoT write; preview can refresh.
        paintFromState(state);
        return;
      }

      if (nextMd === lastSoTMd) {
        // Echo / structural no-op for MD text — refresh preview from prose SoT.
        paintFromState(state);
        return;
      }

      // External SoT (toolbar / setText / undo/redo): drop stale debounce and push CM.
      if (sotTimer) {
        clearTimeout(sotTimer);
        sotTimer = null;
      }
      lastSoTMd = nextMd;
      const cmText = mdHandle?.getText() ?? '';
      if (cmText !== nextMd) {
        mdHandle?.setText(nextMd, { caret: 'preserve' });
      }
      paintFromState(state);
      setDirty(false);
    },
    flushPendingSoT(): void {
      if (!sotTimer || dirtyDraft) {
        return;
      }
      clearTimeout(sotTimer);
      sotTimer = null;
      commitLiveSoT(mdHandle?.getText() ?? '');
    },
    destroy(): void {
      hydrateAbort?.abort();
      hydrateAbort = null;
      scrollSync?.unbind();
      scrollSync = null;
      if (draftPreviewTimer) {
        clearTimeout(draftPreviewTimer);
      }
      if (sotTimer) {
        clearTimeout(sotTimer);
        if (!dirtyDraft && mdHandle) {
          commitLiveSoT(mdHandle.getText());
        }
      }
      shellHandle?.destroy();
      shellHandle = null;
      mdHandle = null;
    },
    applyDraft,
    discardDraft,
    isDirty: () => dirty,
    getDraftText: () => mdHandle?.getText() ?? lastSoTMd,
    getCursor: () => mdHandle?.getCursor() ?? 0,
    getSelection: () => mdHandle?.getSelection() ?? { from: 0, to: 0 },
    insertAtCursor: (text: string) => {
      mdHandle?.insertAtCursor(text);
    },
    replaceText: (text: string, cursor?: number) => {
      mdHandle?.replaceText(text, cursor);
    },
    focus: () => {
      mdHandle?.focus();
    },
  };
}

/** Seed helper for tests. */
export function seedMdDoc(text: string): DocNode {
  return emptyEditorDoc(text);
}
