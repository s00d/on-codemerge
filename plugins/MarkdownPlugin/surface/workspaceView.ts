import type { DocNode, EditorState, JSONDoc, Operation } from '@on-codemerge/kernel';
import type { EditorAPI } from '@on-codemerge/sdk';
import { foreign, h, mount } from '@on-codemerge/sdk';
import type { MountHandle } from '@on-codemerge/sdk';
import { replaceChildrenWithSafeHtml } from '@ocm/wysiwyg/utils/safeHtml';
import { defaultMdElementRegistry } from '../elements/registry';
import type { MdElementRegistry } from '../elements/types';
import { docToText, emptyEditorDoc, escapeHtml, parseText } from '../io';
import { projectPreviewHtml } from '../io/projectPreview';
import { mountSourceEditor } from '@on-codemerge/editor';
import type { SourceEditorHandle } from '@on-codemerge/editor';
import {
  hydrateMermaidBlocks,
  restoreMermaidHosts,
  salvageMermaidHosts,
} from '../widgets/mermaidHydrate';

/** SoT CM→kernel debounce (typing). */
const SOT_DEBOUNCE_MS = 150;
/**
 * Preview paint debounce — longer than SoT so typing stays responsive while the
 * right pane coalesces full project+DOM+mermaid work.
 */
const PREVIEW_DEBOUNCE_MS = 280;
/** Trailing debounce for remote POST preview (network-friendly default). */
const REMOTE_PREVIEW_DEBOUNCE_MS = 500;

export type MdWorkspaceHost = EditorAPI & {
  replaceDocument?(doc: DocNode | JSONDoc): void;
};

/**
 * Optional server-side preview: POST `{ markdown }` → `text/html`.
 * When set, local projector / mermaid hydrate are skipped for the right pane.
 */
export type MdRemotePreviewOptions = {
  url: string;
  headers?: Record<string, string>;
  /** Trailing debounce before POST (default 500). */
  debounceMs?: number;
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
  /** Remote HTML preview (workspace). Omit → local `projectPreviewHtml`. */
  preview?: MdRemotePreviewOptions;
  /** Fired when a remote preview fetch starts / settles (toolbar busy chrome). */
  onRemotePreviewBusy?: (busy: boolean) => void;
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

const SPLIT_MIN = 0.22;
const SPLIT_MAX = 0.78;
const SPLIT_DEFAULT = 0.5;
const MD_SPLIT_MQ = '(min-width: 768px)';

function isDesktopSplit(): boolean {
  return typeof matchMedia === 'function' && matchMedia(MD_SPLIT_MQ).matches;
}

function bindPaneSplitter(
  panes: HTMLElement,
  editorPane: HTMLElement,
  gutter: HTMLElement
): { unbind(): void } {
  let ratio = SPLIT_DEFAULT;
  let dragging = false;
  let startX = 0;
  let startRatio = SPLIT_DEFAULT;

  const apply = (): void => {
    if (!isDesktopSplit()) {
      editorPane.style.flex = '';
      editorPane.style.width = '';
      editorPane.style.maxWidth = '';
      gutter.setAttribute('aria-valuenow', '50');
      return;
    }
    const pct = `${(ratio * 100).toFixed(2)}%`;
    editorPane.style.flex = `0 0 ${pct}`;
    editorPane.style.width = pct;
    editorPane.style.maxWidth = pct;
    gutter.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  };

  const onWindowResize = (): void => {
    apply();
  };

  const endDrag = (e: PointerEvent): void => {
    if (!dragging) {
      return;
    }
    dragging = false;
    gutter.classList.remove('ocm-md-gutter--active');
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
    try {
      gutter.releasePointerCapture?.(e.pointerId);
    } catch {
      // already released / unsupported
    }
  };

  const onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 || !isDesktopSplit()) {
      return;
    }
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startRatio = ratio;
    gutter.classList.add('ocm-md-gutter--active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    gutter.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!dragging) {
      return;
    }
    const w = panes.getBoundingClientRect().width;
    if (w <= 0) {
      return;
    }
    ratio = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, startRatio + (e.clientX - startX) / w));
    apply();
  };

  const onDblClick = (e: MouseEvent): void => {
    e.preventDefault();
    ratio = SPLIT_DEFAULT;
    apply();
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (!isDesktopSplit()) {
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      ratio = Math.max(SPLIT_MIN, ratio - 0.02);
      apply();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      ratio = Math.min(SPLIT_MAX, ratio + 0.02);
      apply();
    } else if (e.key === 'Home') {
      e.preventDefault();
      ratio = SPLIT_MIN;
      apply();
    } else if (e.key === 'End') {
      e.preventDefault();
      ratio = SPLIT_MAX;
      apply();
    }
  };

  gutter.addEventListener('pointerdown', onPointerDown);
  gutter.addEventListener('pointermove', onPointerMove);
  gutter.addEventListener('pointerup', endDrag);
  gutter.addEventListener('pointercancel', endDrag);
  gutter.addEventListener('dblclick', onDblClick);
  gutter.addEventListener('keydown', onKeyDown);
  globalThis.addEventListener('resize', onWindowResize);
  apply();

  return {
    unbind: () => {
      gutter.removeEventListener('pointerdown', onPointerDown);
      gutter.removeEventListener('pointermove', onPointerMove);
      gutter.removeEventListener('pointerup', endDrag);
      gutter.removeEventListener('pointercancel', endDrag);
      gutter.removeEventListener('dblclick', onDblClick);
      gutter.removeEventListener('keydown', onKeyDown);
      globalThis.removeEventListener('resize', onWindowResize);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    },
  };
}

/** Cheap fingerprint — avoid storing full HTML in a data attribute. */
function previewHtmlHash(html: string): string {
  let hash = 2166136261;
  for (let i = 0; i < html.length; i += 1) {
    hash ^= html.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${html.length}:${hash >>> 0}`;
}

async function paintPreviewFromDoc(
  slot: HTMLElement,
  doc: DocNode,
  elements: MdElementRegistry,
  sync?: ScrollSync | null,
  hydrateCtl?: { abort: AbortController | null; set: (next: AbortController) => void }
): Promise<void> {
  // Sanitize once at the DOM sink (not also inside the projector).
  const html = projectPreviewHtml(doc, { elements, sanitize: false });
  const hash = previewHtmlHash(html);
  const pendingHosts = slot.querySelector(
    'div[data-node="mermaid"]:not([data-ocm-mermaid-ready]), .ocm-md-mermaid:not([data-ocm-mermaid-ready])'
  );
  if (slot.getAttribute('data-ocm-preview-hash') === hash && !pendingHosts) {
    return;
  }

  hydrateCtl?.abort?.abort();
  const ac = new AbortController();
  hydrateCtl?.set(ac);

  const salvaged = salvageMermaidHosts(slot);
  replaceChildrenWithSafeHtml(slot, html);
  restoreMermaidHosts(slot, salvaged);
  slot.setAttribute('data-ocm-preview-hash', hash);

  requestAnimationFrame(() => {
    if (!ac.signal.aborted) {
      sync?.alignPreviewToEditor();
    }
  });
  await hydrateMermaidBlocks(slot, { signal: ac.signal });
  if (ac.signal.aborted) {
    // Allow a later paint with the same hash to retry hydrate.
    slot.removeAttribute('data-ocm-preview-hash');
    return;
  }
  sync?.alignPreviewToEditor();
}

type RemotePreviewCtl = {
  lastFetched: string | null;
  hadGood: boolean;
  fetchAbort: AbortController | null;
  busy: boolean;
  onBusyChange?: (busy: boolean) => void;
};

function setRemoteBusy(ctl: RemotePreviewCtl, busy: boolean): void {
  if (ctl.busy === busy) {
    return;
  }
  ctl.busy = busy;
  ctl.onBusyChange?.(busy);
}

async function paintPreviewRemote(
  slot: HTMLElement,
  markdown: string,
  preview: MdRemotePreviewOptions,
  ctl: RemotePreviewCtl,
  sync?: ScrollSync | null
): Promise<void> {
  if (markdown === ctl.lastFetched) {
    setRemoteBusy(ctl, false);
    return;
  }

  ctl.fetchAbort?.abort();
  const ac = new AbortController();
  ctl.fetchAbort = ac;
  setRemoteBusy(ctl, true);

  try {
    const res = await fetch(preview.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/html',
        ...preview.headers,
      },
      body: JSON.stringify({ markdown }),
      signal: ac.signal,
    });
    if (ac.signal.aborted) {
      return;
    }
    if (!res.ok) {
      throw new Error(`Preview HTTP ${res.status}`);
    }
    const html = await res.text();
    if (ac.signal.aborted) {
      return;
    }
    const hash = previewHtmlHash(html);
    if (slot.getAttribute('data-ocm-preview-hash') === hash) {
      ctl.lastFetched = markdown;
      ctl.hadGood = true;
      return;
    }
    replaceChildrenWithSafeHtml(slot, html);
    slot.setAttribute('data-ocm-preview-hash', hash);
    ctl.lastFetched = markdown;
    ctl.hadGood = true;
    requestAnimationFrame(() => {
      if (!ac.signal.aborted) {
        sync?.alignPreviewToEditor();
      }
    });
  } catch (err) {
    if (ac.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      return;
    }
    // Keep last good HTML; only paint an error stub when the pane is empty.
    if (!ctl.hadGood) {
      const msg = err instanceof Error ? err.message : 'Preview failed';
      replaceChildrenWithSafeHtml(
        slot,
        `<p class="ocm-md-preview-error text-sm text-red-600 p-3">${escapeHtml(msg)}</p>`
      );
      slot.removeAttribute('data-ocm-preview-hash');
    }
  } finally {
    if (ctl.fetchAbort === ac) {
      ctl.fetchAbort = null;
      setRemoteBusy(ctl, false);
    }
  }
}

export function mountMdWorkspace(
  editor: MdWorkspaceHost,
  contentHost: HTMLElement,
  options: MdWorkspaceOptions = {}
): MdWorkspaceHandle {
  const dirtyDraft = options.dirtyDraft === true;
  const elements = options.elements ?? defaultMdElementRegistry;
  const remotePreview = options.preview?.url ? options.preview : null;
  const previewDebounceMs = remotePreview
    ? Math.max(0, remotePreview.debounceMs ?? REMOTE_PREVIEW_DEBOUNCE_MS)
    : PREVIEW_DEBOUNCE_MS;
  contentHost.classList.add('ocm-md-root');

  let dirty = false;
  let lastSoTMd = docToText(editor.getState().doc);
  let sotTimer: ReturnType<typeof setTimeout> | null = null;
  let previewTimer: ReturnType<typeof setTimeout> | null = null;
  let previewRaf = 0;
  let pendingPreviewDoc: DocNode | null = null;
  let shellHandle: MountHandle | null = null;
  let mdHandle: SourceEditorHandle | null = null;
  const scrollCapture: { el: HTMLElement | null } = { el: null };
  let scrollSync: ScrollSync | null = null;
  let paneSplitter: { unbind(): void } | null = null;
  let hydrateAbort: AbortController | null = null;
  const hydrateCtl = {
    get abort() {
      return hydrateAbort;
    },
    set(next: AbortController) {
      hydrateAbort = next;
    },
  };
  const remoteCtl: RemotePreviewCtl = {
    lastFetched: null,
    hadGood: false,
    fetchAbort: null,
    busy: false,
    onBusyChange: options.onRemotePreviewBusy,
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

  const flushPreviewPaint = (): void => {
    const doc = pendingPreviewDoc;
    pendingPreviewDoc = null;
    const slot = shellHandle?.refs.preview;
    if (!(slot instanceof HTMLElement) || !doc) {
      return;
    }
    if (previewRaf) {
      cancelAnimationFrame(previewRaf);
      previewRaf = 0;
    }
    previewRaf = requestAnimationFrame(() => {
      previewRaf = 0;
      if (remotePreview) {
        setRemoteBusy(remoteCtl, true);
        void paintPreviewRemote(slot, docToText(doc), remotePreview, remoteCtl, scrollSync);
        return;
      }
      void paintPreviewFromDoc(slot, doc, elements, scrollSync, hydrateCtl);
    });
  };

  /** Coalesce expensive preview paints; `immediate` for mount / Apply / external setText. */
  const schedulePreviewPaint = (state: EditorState, immediate = false): void => {
    pendingPreviewDoc = state.doc;
    if (previewTimer) {
      clearTimeout(previewTimer);
      previewTimer = null;
    }
    if (immediate) {
      flushPreviewPaint();
      return;
    }
    previewTimer = setTimeout(() => {
      previewTimer = null;
      flushPreviewPaint();
    }, previewDebounceMs);
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
    }, SOT_DEBOUNCE_MS);
  };

  const onEditorChanged = (): void => {
    const text = mdHandle?.getText() ?? '';
    if (dirtyDraft) {
      setDirty(text !== lastSoTMd);
      // Draft preview: debounce parse → coalesced projector (parent SoT untouched).
      // Remote: still need a doc shell for flush; parse is local MD→tree only.
      if (previewTimer) {
        clearTimeout(previewTimer);
      }
      previewTimer = setTimeout(() => {
        previewTimer = null;
        if (remotePreview) {
          const slot = shellHandle?.refs.preview;
          if (slot instanceof HTMLElement) {
            setRemoteBusy(remoteCtl, true);
            void paintPreviewRemote(slot, text, remotePreview, remoteCtl, scrollSync);
          }
          return;
        }
        const parsed = parseText(text);
        if (parsed.ok) {
          pendingPreviewDoc = parsed.doc;
          flushPreviewPaint();
        }
      }, previewDebounceMs);
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
    schedulePreviewPaint(editor.getState(), true);
    setDirty(false);
    options.onDiscard?.();
  };

  shellHandle = mount(
    contentHost,
    h('div', { class: 'ocm-md-shell' }, [
      h('div', { ref: 'panes', class: 'ocm-md-panes' }, [
        h('div', { ref: 'editorPane', class: 'ocm-md-pane ocm-md-pane--editor' }, [
          foreign((host, scope) => {
            host.classList.add(
              'ocm-md-source-host',
              'flex',
              'h-full',
              'min-h-0',
              'flex-1',
              'flex-col'
            );
            mdHandle = mountSourceEditor(host, {
              initialText: lastSoTMd,
              onDocChanged: onEditorChanged,
              onApplyRequest: dirtyDraft ? () => applyDraft() : undefined,
            });
            scrollCapture.el = mdHandle.scrollDOM;
            scope.disposable(() => {
              mdHandle?.destroy();
              mdHandle = null;
              scrollCapture.el = null;
            });
          }),
        ]),
        h(
          'div',
          {
            ref: 'gutter',
            class: 'ocm-md-gutter',
            attrs: {
              role: 'separator',
              'aria-orientation': 'vertical',
              'aria-label': 'Resize source and preview',
              'aria-valuemin': '22',
              'aria-valuemax': '78',
              'aria-valuenow': '50',
              tabindex: '0',
            },
          },
          [h('span', { class: 'ocm-md-gutter__grip', attrs: { 'aria-hidden': 'true' } })]
        ),
        h('div', {
          ref: 'preview',
          class: 'ocm-md-pane ocm-md-pane--preview ocm-md-preview',
        }),
      ]),
      h('div', { ref: 'status', class: 'ocm-md-status' }),
    ])
  );

  const previewSlot = shellHandle.refs.preview;
  const panesEl = shellHandle.refs.panes;
  const editorPaneEl = shellHandle.refs.editorPane;
  const gutterEl = shellHandle.refs.gutter;
  const sourceScrollEl = scrollCapture.el;
  if (sourceScrollEl !== null && previewSlot instanceof HTMLElement) {
    scrollSync = bindProportionalScroll(sourceScrollEl, previewSlot);
  }
  if (
    panesEl instanceof HTMLElement &&
    editorPaneEl instanceof HTMLElement &&
    gutterEl instanceof HTMLElement
  ) {
    paneSplitter = bindPaneSplitter(panesEl, editorPaneEl, gutterEl);
  }
  schedulePreviewPaint(editor.getState(), true);
  paintStatus();

  return {
    update(state: EditorState): void {
      const nextMd = docToText(state.doc);
      if (dirtyDraft && dirty) {
        return;
      }

      // Own CM→SoT commit echo: schedule coalesced preview — never rewrite the source pane.
      if (applyingSoT) {
        lastSoTMd = nextMd;
        schedulePreviewPaint(state);
        return;
      }

      if (!dirtyDraft && sotTimer && nextMd === lastSoTMd) {
        // Debounce still owns the next CM→SoT write; skip preview noise.
        return;
      }

      if (nextMd === lastSoTMd) {
        // Structural SoT change without MD text change — coalesce preview.
        schedulePreviewPaint(state);
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
      schedulePreviewPaint(state, true);
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
      remoteCtl.fetchAbort?.abort();
      remoteCtl.fetchAbort = null;
      paneSplitter?.unbind();
      paneSplitter = null;
      scrollSync?.unbind();
      scrollSync = null;
      if (previewTimer) {
        clearTimeout(previewTimer);
        previewTimer = null;
      }
      if (previewRaf) {
        cancelAnimationFrame(previewRaf);
        previewRaf = 0;
      }
      pendingPreviewDoc = null;
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
