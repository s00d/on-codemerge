import { createFrameScheduler, h, mount } from '@codemerge/sdk';
import type { MountHandle } from '@codemerge/sdk';
import { highlightHtml } from '../highlight';

export type SourceEditorHandle = {
  getText(): string;
  setText(text: string, opts?: { caret?: 'preserve' | 'end' }): void;
  insertAtCursor(text: string): void;
  replaceText(text: string, cursor?: number): void;
  getCursor(): number;
  getSelection(): { from: number; to: number };
  /** 1-based line count currently shown in the gutter. */
  getLineCount(): number;
  focus(): void;
  destroy(): void;
  readonly dom: HTMLElement;
  /** Scroll container for dual-pane sync (textarea). */
  readonly scrollDOM: HTMLElement;
};

export type SourceEditorOptions = {
  initialText: string;
  onDocChanged(): void;
  /** Mod-s / explicit apply request from keymap. */
  onApplyRequest?: () => void;
};

const TAB_INDENT = '  ';
/** Shared metrics — textarea ignores Tailwind line-height; pin px so gutter tracks glyphs. */
const SE_FONT_PX = 13;
const SE_LINE_PX = 20;
const SE_PAD_PX = 4;
/** Floor width so the rail can never collapse to a hairline (flex/`ch` bugs). */
const SE_GUTTER_MIN_PX = 36;
/** Below this, paint every gutter row; above — virtualize to the viewport (+ buffer). */
const GUTTER_VIRTUAL_THRESHOLD = 256;
const GUTTER_VIEW_BUFFER = 6;
const SE_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

const seType: Record<string, string> = {
  fontFamily: SE_FONT,
  fontSize: `${SE_FONT_PX}px`,
  lineHeight: `${SE_LINE_PX}px`,
  padding: `${SE_PAD_PX}px`,
  tabSize: '2',
  boxSizing: 'border-box',
  // Reserve scrollbar lane so H-scrollbar does not shrink clientHeight vs gutter rail.
  scrollbarGutter: 'stable',
};

function measureMonoChPx(): number {
  if (typeof document === 'undefined') {
    return SE_FONT_PX * 0.6;
  }
  const span = document.createElement('span');
  span.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${SE_FONT_PX}px ${SE_FONT}`;
  span.textContent = '0';
  document.body.append(span);
  const w = span.getBoundingClientRect().width;
  span.remove();
  return w > 0 ? w : SE_FONT_PX * 0.6;
}

/** Pixel gutter column width for N digit places — never below SE_GUTTER_MIN_PX. */
export function sourceGutterWidthPx(digits: number, chPx = measureMonoChPx()): number {
  const cols = Math.max(2, digits) + 1;
  return Math.max(SE_GUTTER_MIN_PX, Math.ceil(cols * chPx) + SE_PAD_PX * 2);
}

/** Nominal content box height for N logical lines (pad + line boxes). */
export function sourceContentHeight(lines: number): number {
  return Math.max(1, lines) * SE_LINE_PX + 2 * SE_PAD_PX;
}

/** Extra bottom pad so gutter/mirror scrollHeight tracks textarea (trailing \\n / browser quirks). */
export function sourceScrollPadBottom(scrollHeight: number, lines: number): number {
  return Math.max(0, scrollHeight - sourceContentHeight(lines));
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

function paintHtml(codeEl: HTMLElement, source: string): void {
  const html = highlightHtml(source);
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  codeEl.replaceChildren(tpl.content);
}

function indentSelection(
  value: string,
  from: number,
  to: number
): {
  next: string;
  selFrom: number;
  selTo: number;
} {
  if (from === to) {
    const next = `${value.slice(0, from)}${TAB_INDENT}${value.slice(to)}`;
    const pos = from + TAB_INDENT.length;
    return { next, selFrom: pos, selTo: pos };
  }
  let lineStart = value.lastIndexOf('\n', Math.max(0, from - 1)) + 1;
  const endProbe = to > from && value.charAt(to - 1) === '\n' ? to - 1 : to;
  let end = value.indexOf('\n', endProbe);
  if (end < 0) {
    end = value.length;
  }
  const before = value.slice(0, lineStart);
  const block = value.slice(lineStart, end);
  const after = value.slice(end);
  const indented = block
    .split('\n')
    .map((line) => `${TAB_INDENT}${line}`)
    .join('\n');
  const next = `${before}${indented}${after}`;
  const added = indented.length - block.length;
  return { next, selFrom: from + TAB_INDENT.length, selTo: to + added };
}

function stripLineIndent(line: string): { line: string; removed: number } {
  if (line.startsWith(TAB_INDENT)) {
    return { line: line.slice(TAB_INDENT.length), removed: TAB_INDENT.length };
  }
  if (line.startsWith('\t') || line.startsWith(' ')) {
    return { line: line.slice(1), removed: 1 };
  }
  return { line, removed: 0 };
}

/** Unindent lines covering half-open [from, to); caret unindents the current line. */
function unindentSelection(
  value: string,
  from: number,
  to: number
): {
  next: string;
  selFrom: number;
  selTo: number;
} {
  const lineStart = value.lastIndexOf('\n', Math.max(0, from - 1)) + 1;
  const endProbe = to > from && value.charAt(to - 1) === '\n' ? to - 1 : to;
  let end = value.indexOf('\n', endProbe);
  if (end < 0) {
    end = value.length;
  }
  const before = value.slice(0, lineStart);
  const block = value.slice(lineStart, end);
  const after = value.slice(end);
  const lines = block.split('\n');
  let removedBeforeFrom = 0;
  let removedTotal = 0;
  let offset = 0;
  const out: string[] = [];
  for (const line of lines) {
    const { line: nextLine, removed } = stripLineIndent(line);
    const lineAbsStart = lineStart + offset;
    if (lineAbsStart < from) {
      removedBeforeFrom += removed;
    }
    removedTotal += removed;
    out.push(nextLine);
    offset += line.length + 1;
  }
  const next = `${before}${out.join('\n')}${after}`;
  return {
    next,
    selFrom: Math.max(lineStart, from - removedBeforeFrom),
    selTo: Math.max(lineStart, to - removedTotal),
  };
}

/**
 * Textarea (SoT) + highlighted mirror + line gutter. Not contenteditable.
 */
export function mountSourceEditor(
  host: HTMLElement,
  options: SourceEditorOptions
): SourceEditorHandle {
  host.replaceChildren();

  let suppress = false;
  const frames = createFrameScheduler();
  let destroyed = false;
  let lineCount = lineCountOf(options.initialText);

  let mountHandle: MountHandle | null = null;
  let gutterLinesHandle: MountHandle | null = null;
  let textarea: HTMLTextAreaElement | null = null;
  let codeEl: HTMLElement | null = null;
  let mirrorEl: HTMLElement | null = null;
  let rootEl: HTMLElement | null = null;
  let gutterRailEl: HTMLElement | null = null;
  let gutterInnerEl: HTMLElement | null = null;
  let paneEl: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let scrollPadBottom = 0;
  let gutterWinStart = 0;
  let gutterWinEnd = 0;
  let imeComposing = false;
  const monoChPx = measureMonoChPx();

  type Snapshot = { value: string; from: number; to: number };
  const UNDO_LIMIT = 100;
  const undoStack: Snapshot[] = [];
  const redoStack: Snapshot[] = [];
  let typingBaseline: Snapshot | null = null;
  let coalesceTimer: ReturnType<typeof setTimeout> | null = null;

  const snapshot = (): Snapshot => ({
    value: textarea?.value ?? '',
    from: textarea?.selectionStart ?? 0,
    to: textarea?.selectionEnd ?? 0,
  });

  const clearHistory = (): void => {
    undoStack.length = 0;
    redoStack.length = 0;
    typingBaseline = null;
    if (coalesceTimer) {
      clearTimeout(coalesceTimer);
      coalesceTimer = null;
    }
  };

  const pushUndo = (snap: Snapshot): void => {
    const top = undoStack.at(-1);
    if (top && top.value === snap.value && top.from === snap.from && top.to === snap.to) {
      return;
    }
    undoStack.push(snap);
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift();
    }
    redoStack.length = 0;
  };

  const flushTypingBaseline = (): void => {
    if (coalesceTimer) {
      clearTimeout(coalesceTimer);
      coalesceTimer = null;
    }
    if (typingBaseline) {
      pushUndo(typingBaseline);
      typingBaseline = null;
    }
  };

  const syncScrollExtents = (): void => {
    if (!textarea || !gutterInnerEl || !codeEl || !mirrorEl) {
      return;
    }
    // Match textarea scrollHeight exactly so translateY(-scrollTop) never overshoots at EOF.
    const target = textarea.scrollHeight;
    scrollPadBottom = sourceScrollPadBottom(target, lineCount);
    gutterInnerEl.style.minHeight = `${target}px`;
    gutterInnerEl.style.paddingBottom = `${SE_PAD_PX + scrollPadBottom}px`;
    // Mirror scrollport: pad code so pre scrollHeight tracks textarea (padding is on <pre>).
    const codeMin = Math.max(lineCount * SE_LINE_PX, target - 2 * SE_PAD_PX);
    codeEl.style.minHeight = `${codeMin}px`;
    codeEl.style.paddingBottom = `${scrollPadBottom}px`;
  };

  const gutterVisibleRange = (
    scrollTop: number,
    viewH: number,
    total: number
  ): { start: number; end: number } => {
    const n = Math.max(1, total);
    if (n <= GUTTER_VIRTUAL_THRESHOLD) {
      return { start: 1, end: n };
    }
    // No layout yet — never materialize 10k nodes; stub a short window.
    if (viewH < SE_LINE_PX) {
      return { start: 1, end: Math.min(n, 48) };
    }
    const first0 = Math.floor(Math.max(0, scrollTop - SE_PAD_PX) / SE_LINE_PX);
    const vis = Math.ceil(viewH / SE_LINE_PX) + GUTTER_VIEW_BUFFER * 2;
    const start = Math.max(1, first0 - GUTTER_VIEW_BUFFER + 1);
    const end = Math.min(n, start + vis - 1);
    return { start, end };
  };

  const paintGutterWindow = (scrollTop: number): void => {
    if (!gutterRailEl || !gutterInnerEl) {
      return;
    }
    const viewH = gutterRailEl.clientHeight;
    const { start, end } = gutterVisibleRange(scrollTop, viewH, lineCount);
    if (start === gutterWinStart && end === gutterWinEnd && gutterLinesHandle) {
      return;
    }
    gutterWinStart = start;
    gutterWinEnd = end;
    const rows = [];
    for (let i = start; i <= end; i += 1) {
      rows.push(
        h(
          'div',
          {
            class: 'ocm-source-editor__gutter-line text-right',
            attrs: { 'data-line': String(i) },
            style: {
              height: `${SE_LINE_PX}px`,
              lineHeight: `${SE_LINE_PX}px`,
              fontSize: `${SE_FONT_PX}px`,
              fontFamily: SE_FONT,
            },
          },
          String(i)
        )
      );
    }
    gutterLinesHandle?.destroy();
    gutterLinesHandle = mount(
      gutterInnerEl,
      h(
        'div',
        {
          class: 'ocm-source-editor__gutter-lines',
          style: {
            paddingTop: `${(start - 1) * SE_LINE_PX}px`,
          },
        },
        rows
      )
    );
  };

  const syncScroll = (): void => {
    if (!textarea) {
      return;
    }
    const top = textarea.scrollTop;
    const left = textarea.scrollLeft;
    if (mirrorEl) {
      mirrorEl.scrollTop = top;
      mirrorEl.scrollLeft = left;
    }
    // Transform — not gutter.scrollTop — so scrollbar chrome on the textarea cannot desync.
    if (gutterInnerEl) {
      const maxFromTa = Math.max(0, textarea.scrollHeight - textarea.clientHeight);
      const y = Math.min(Math.max(0, top), maxFromTa);
      gutterInnerEl.style.transform = `translateY(${-y}px)`;
      paintGutterWindow(y);
    }
  };

  const paintGutter = (count: number): void => {
    if (!gutterRailEl || !gutterInnerEl || !rootEl) {
      return;
    }
    lineCount = Math.max(1, count);
    const digits = String(lineCount).length;
    const gutterPx = sourceGutterWidthPx(digits, monoChPx);
    // CSS grid column in px — never `ch`/`flex` (those collapsed the rail to 0 height/width).
    rootEl.style.gridTemplateColumns = `${gutterPx}px minmax(0, 1fr)`;
    gutterRailEl.style.width = '100%';
    gutterRailEl.style.minWidth = '0';
    gutterWinStart = 0;
    gutterWinEnd = 0;
    syncScrollExtents();
    paintGutterWindow(textarea?.scrollTop ?? 0);
  };

  const schedulePaint = (): void => {
    frames.schedule(() => {
      if (destroyed || !textarea || !codeEl) {
        return;
      }
      paintHtml(codeEl, textarea.value);
      const nextLines = lineCountOf(textarea.value);
      if (nextLines !== lineCount) {
        paintGutter(nextLines);
      } else {
        syncScrollExtents();
      }
      syncScroll();
    }, 'replace');
  };

  const notify = (): void => {
    if (!suppress) {
      options.onDocChanged();
    }
  };

  const applyValue = (
    next: string,
    selFrom: number,
    selTo: number,
    doNotify: boolean,
    hist: 'record' | 'clear' | 'none' = 'none'
  ): void => {
    if (!textarea) {
      return;
    }
    if (hist === 'clear') {
      clearHistory();
    } else if (hist === 'record') {
      flushTypingBaseline();
      pushUndo(snapshot());
    } else {
      flushTypingBaseline();
    }
    textarea.value = next;
    const len = next.length;
    textarea.setSelectionRange(
      Math.max(0, Math.min(selFrom, len)),
      Math.max(0, Math.min(selTo, len))
    );
    schedulePaint();
    if (doNotify) {
      notify();
    }
  };

  const restoreSnapshot = (snap: Snapshot, doNotify: boolean): void => {
    if (!textarea) {
      return;
    }
    typingBaseline = null;
    if (coalesceTimer) {
      clearTimeout(coalesceTimer);
      coalesceTimer = null;
    }
    textarea.value = snap.value;
    const len = snap.value.length;
    textarea.setSelectionRange(
      Math.max(0, Math.min(snap.from, len)),
      Math.max(0, Math.min(snap.to, len))
    );
    schedulePaint();
    if (doNotify) {
      notify();
    }
  };

  const initialGutterPx = sourceGutterWidthPx(String(lineCount).length, monoChPx);

  mountHandle = mount(
    host,
    h(
      'div',
      {
        // CSS grid (not flex-row): gutter track is a real column — cannot collapse to 0×height.
        class:
          'ocm-source-editor not-prose relative grid h-full min-h-0 w-full flex-1 self-stretch overflow-hidden bg-ocm-surface text-ocm-text',
        attrs: { role: 'group' },
        style: {
          display: 'grid',
          gridTemplateColumns: `${initialGutterPx}px minmax(0, 1fr)`,
          gridTemplateRows: 'minmax(0, 1fr)',
          alignItems: 'stretch',
          justifyItems: 'stretch',
        },
        ref: 'root',
      },
      [
        h(
          'div',
          {
            // contain:size — rail box is the grid track only; absolute digits cannot collapse it.
            class:
              'ocm-source-editor__gutter relative h-full min-h-0 min-w-0 overflow-hidden border-r border-ocm-border bg-ocm-surface-muted text-ocm-text-muted select-none',
            attrs: { 'aria-hidden': 'true' },
            style: {
              contain: 'strict',
              height: '100%',
              width: '100%',
              fontFamily: SE_FONT,
              fontSize: `${SE_FONT_PX}px`,
              lineHeight: `${SE_LINE_PX}px`,
            },
            ref: 'gutter',
          },
          [
            h('div', {
              class:
                'ocm-source-editor__gutter-inner absolute inset-x-0 top-0 will-change-transform',
              style: {
                paddingTop: `${SE_PAD_PX}px`,
                paddingBottom: `${SE_PAD_PX}px`,
                paddingRight: `${SE_PAD_PX}px`,
                paddingLeft: `${SE_PAD_PX}px`,
                boxSizing: 'border-box',
                fontFamily: SE_FONT,
                fontSize: `${SE_FONT_PX}px`,
                lineHeight: `${SE_LINE_PX}px`,
              },
              ref: 'gutterInner',
            }),
          ]
        ),
        h(
          'div',
          {
            class:
              'ocm-source-editor__pane relative h-full min-h-0 min-w-0 overflow-hidden bg-ocm-surface',
            style: { height: '100%', minHeight: '0' },
            ref: 'pane',
          },
          [
            h(
              'pre',
              {
                class:
                  'ocm-source-editor__mirror pointer-events-none absolute inset-0 z-0 m-0 overflow-auto rounded-none border-0 bg-transparent text-ocm-text shadow-none',
                attrs: { 'aria-hidden': 'true' },
                style: { ...seType, margin: '0' },
                ref: 'mirror',
              },
              [
                h('code', {
                  class: 'ocm-source-editor__code block bg-transparent whitespace-pre',
                  style: {
                    fontFamily: SE_FONT,
                    fontSize: `${SE_FONT_PX}px`,
                    lineHeight: `${SE_LINE_PX}px`,
                    padding: '0',
                    margin: '0',
                    background: 'transparent',
                  },
                  ref: 'code',
                }),
              ]
            ),
            h('textarea', {
              class:
                'ocm-source-editor__input absolute inset-0 z-10 m-0 h-full w-full resize-none overflow-auto border-0 bg-transparent outline-none',
              attrs: {
                wrap: 'off',
                spellcheck: 'false',
                autocapitalize: 'off',
                autocomplete: 'off',
                autocorrect: 'off',
                'aria-label': 'Source editor',
              },
              // color keeps caret; glyphs hidden via webkit fill (color:transparent hides caret in WebKit).
              style: {
                ...seType,
                color: 'var(--color-ocm-text, #18181b)',
                caretColor: 'var(--color-ocm-text, #18181b)',
                WebkitTextFillColor: 'transparent',
              },
              props: { value: options.initialText },
              ref: 'input',
              on: {
                input: () => {
                  // Native edit after undo must drop redo — do not wait for coalesce flush.
                  redoStack.length = 0;
                  if (typingBaseline) {
                    if (coalesceTimer) {
                      clearTimeout(coalesceTimer);
                    }
                    coalesceTimer = setTimeout(() => {
                      coalesceTimer = null;
                      flushTypingBaseline();
                    }, 400);
                  }
                  schedulePaint();
                  // Skip SoT notify mid-IME; compositionend fires once with the final string.
                  if (imeComposing) {
                    return;
                  }
                  notify();
                },
                compositionstart: () => {
                  imeComposing = true;
                },
                compositionend: () => {
                  imeComposing = false;
                  schedulePaint();
                  notify();
                },
                beforeinput: (ev) => {
                  const t = ev.inputType;
                  if (
                    t !== 'insertFromPaste' &&
                    t !== 'insertFromDrop' &&
                    t !== 'deleteByCut' &&
                    t !== 'historyUndo' &&
                    t !== 'historyRedo'
                  ) {
                    return;
                  }
                  // Own clipboard/drop as atomic undo units; block browser history (we own Mod-z).
                  if (t === 'historyUndo' || t === 'historyRedo') {
                    ev.preventDefault();
                    return;
                  }
                  flushTypingBaseline();
                  pushUndo(snapshot());
                  typingBaseline = null;
                },
                scroll: () => {
                  syncScroll();
                },
                keydown: (ev) => {
                  const mod = ev.metaKey || ev.ctrlKey;
                  const key = ev.key.toLowerCase();
                  if (mod && !ev.altKey && (key === 'z' || key === 'y')) {
                    const isRedo = key === 'y' || (key === 'z' && ev.shiftKey);
                    const isUndo = key === 'z' && !ev.shiftKey;
                    if (isUndo) {
                      flushTypingBaseline();
                      ev.preventDefault();
                      if (undoStack.length === 0) {
                        return;
                      }
                      const cur = snapshot();
                      const prev = undoStack.pop();
                      if (!prev) {
                        return;
                      }
                      redoStack.push(cur);
                      restoreSnapshot(prev, true);
                      return;
                    }
                    if (isRedo) {
                      ev.preventDefault();
                      if (redoStack.length === 0) {
                        return;
                      }
                      const cur = snapshot();
                      const next = redoStack.pop();
                      if (!next) {
                        return;
                      }
                      undoStack.push(cur);
                      restoreSnapshot(next, true);
                      return;
                    }
                  }
                  if (ev.key === 'Tab' && !mod && !ev.altKey) {
                    ev.preventDefault();
                    if (!textarea) {
                      return;
                    }
                    const from = textarea.selectionStart;
                    const to = textarea.selectionEnd;
                    const { next, selFrom, selTo } = ev.shiftKey
                      ? unindentSelection(textarea.value, from, to)
                      : indentSelection(textarea.value, from, to);
                    applyValue(next, selFrom, selTo, true, 'record');
                    return;
                  }
                  if (
                    !mod &&
                    !ev.altKey &&
                    ev.key !== 'Tab' &&
                    ev.key !== 'Escape' &&
                    !ev.isComposing &&
                    typingBaseline === null
                  ) {
                    typingBaseline = snapshot();
                  }
                  if (!options.onApplyRequest) {
                    return;
                  }
                  if (mod && key === 's') {
                    ev.preventDefault();
                    options.onApplyRequest();
                  }
                },
              },
            }),
          ]
        ),
      ]
    )
  );

  const inputEl = mountHandle.refs.input;
  if (!(inputEl instanceof HTMLTextAreaElement)) {
    throw new Error('source editor input missing');
  }
  textarea = inputEl;
  codeEl = mountHandle.refs.code;
  mirrorEl = mountHandle.refs.mirror;
  rootEl = mountHandle.refs.root;
  gutterRailEl = mountHandle.refs.gutter;
  gutterInnerEl = mountHandle.refs.gutterInner;
  paneEl = mountHandle.refs.pane;

  paintHtml(codeEl, options.initialText);
  paintGutter(lineCount);
  textarea.setSelectionRange(0, 0);

  if (typeof ResizeObserver !== 'undefined' && textarea !== null) {
    resizeObserver = new ResizeObserver(() => {
      if (destroyed) {
        return;
      }
      // Host flex chain often settles after first paint — force gutter window remeasure.
      gutterWinStart = 0;
      gutterWinEnd = 0;
      schedulePaint();
    });
    resizeObserver.observe(textarea);
    if (paneEl !== null) {
      resizeObserver.observe(paneEl);
    }
    if (rootEl !== null) {
      resizeObserver.observe(rootEl);
    }
    if (gutterRailEl !== null) {
      resizeObserver.observe(gutterRailEl);
    }
  }

  const getText = (): string => textarea?.value ?? '';

  return {
    dom: host,
    scrollDOM: textarea,
    getText,
    getLineCount: () => lineCount,
    setText(text, opts) {
      if (!textarea) {
        return;
      }
      if (textarea.value === text) {
        return;
      }
      const caret =
        opts?.caret === 'end'
          ? text.length
          : Math.max(0, Math.min(textarea.selectionStart, text.length));
      suppress = true;
      applyValue(text, caret, caret, false, 'clear');
      suppress = false;
    },
    insertAtCursor(text) {
      if (!textarea) {
        return;
      }
      const from = textarea.selectionStart;
      const to = textarea.selectionEnd;
      applyValue(
        `${textarea.value.slice(0, from)}${text}${textarea.value.slice(to)}`,
        from + text.length,
        from + text.length,
        true,
        'record'
      );
    },
    replaceText(text, cursor) {
      if (!textarea) {
        return;
      }
      const pos = cursor === undefined ? text.length : Math.max(0, Math.min(cursor, text.length));
      suppress = true;
      applyValue(text, pos, pos, false, 'clear');
      suppress = false;
      notify();
    },
    getCursor: () => textarea?.selectionStart ?? 0,
    getSelection: () => ({
      from: textarea?.selectionStart ?? 0,
      to: textarea?.selectionEnd ?? 0,
    }),
    focus() {
      textarea?.focus();
    },
    destroy() {
      destroyed = true;
      clearHistory();
      frames.cancel();
      resizeObserver?.disconnect();
      resizeObserver = null;
      gutterLinesHandle?.destroy();
      gutterLinesHandle = null;
      mountHandle?.destroy();
      mountHandle = null;
      textarea = null;
      codeEl = null;
      mirrorEl = null;
      rootEl = null;
      gutterRailEl = null;
      gutterInnerEl = null;
      paneEl = null;
      host.replaceChildren();
    },
  };
}
