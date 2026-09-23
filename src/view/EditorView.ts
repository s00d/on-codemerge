import type { DocNode, Selection, EditorState } from '@on-codemerge/kernel';
import { h, renderDetached, mount as mountView, DisposableScope } from '@on-codemerge/sdk';
import type { MountHandle, WidgetDefinition, WidgetContext, EditorAPI } from '@on-codemerge/sdk';
import { editorChromeTv } from '@on-codemerge/sdk/ui/chrome';
import { docToHTML, escapeHTML } from '../io/html';
import { asAttr } from '../utils/asAttr';
import { replaceChildrenWithHtml } from '../utils/domHtml';

export interface ViewOptions {
  viewportSize?: number;
  overscan?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Projects EditorState into a host element.
 * Chrome root via ViewSpec; content host is doc-render mount-point.
 */
export class EditorView {
  readonly root: HTMLElement;
  readonly content: HTMLElement;
  private readonly chromeMount: MountHandle;
  private state: EditorState;
  private readonly options: Required<ViewOptions>;
  private viewportStart = 0;
  private readonly widgets: Map<string, WidgetDefinition>;
  private readonly widgetCleanups: (() => void)[] = [];
  private lastFingerprint = '';
  /** True while rewriting DOM / restoring caret — InputBridge must ignore selectionchange. */
  private projecting = false;
  private getEditor: (() => EditorAPI | null) | null = null;

  constructor(
    host: HTMLElement,
    state: EditorState,
    options: ViewOptions = {},
    widgets = new Map<string, WidgetDefinition>()
  ) {
    this.options = {
      overscan: options.overscan ?? 20,
      viewportSize: options.viewportSize ?? 200,
    };
    this.widgets = widgets;
    this.state = state;
    const chrome = editorChromeTv();
    const built = renderDetached(
      h(
        'div',
        {
          class: chrome.root(),
          attrs: { role: 'textbox', 'aria-multiline': 'true' },
          ref: 'root',
        },
        h('div', {
          class: chrome.content(),
          attrs: { spellcheck: 'false' },
          props: { contentEditable: true },
          ref: 'content',
        })
      )
    );
    this.root = built.el;
    this.content = (built.el.firstElementChild as HTMLElement) ?? built.el;
    this.content.contentEditable = 'true';
    this.content.spellcheck = false;
    host.append(this.root);
    this.chromeMount = {
      el: this.root,
      refs: { root: this.root, content: this.content },
      update: () => {},
      destroy: () => {
        built.destroy();
        this.root.remove();
      },
    };
    this.render(true);
  }

  /** Bind editor API for declarative widgets (updateAttrs / openMenu). */
  setEditorAccessor(getEditor: () => EditorAPI | null): void {
    this.getEditor = getEditor;
  }

  get isProjecting(): boolean {
    return this.projecting;
  }

  getState(): EditorState {
    return this.state;
  }

  update(state: EditorState): void {
    this.state = state;
    this.render(false);
  }

  /** Force re-project from model (integrity recovery). */
  forceSync(): void {
    this.render(true);
  }

  mountedBlockCount(): number {
    return this.content.querySelectorAll('[data-ocm-block]').length;
  }

  setViewportStart(index: number): void {
    this.viewportStart = Math.max(0, index);
    this.render(true);
  }

  destroy(): void {
    this.clearWidgets();
    this.chromeMount.destroy();
  }

  /** Apply browser selection from model selection (supports nested paths). */
  applyDomSelection(): void {
    const sel = this.state.selection;
    const anchorEl = findPathElement(this.content, sel.anchor.path);
    const focusEl = findPathElement(this.content, sel.focus.path) ?? anchorEl;
    if (!(anchorEl instanceof HTMLElement) || !(focusEl instanceof HTMLElement)) {
      return;
    }
    const a = textOffsetToDom(anchorEl, sel.anchor.offset),
      f = textOffsetToDom(focusEl, sel.focus.offset);
    if (!a || !f) {
      return;
    }
    const range = document.createRange();
    try {
      const reverse =
        a.node === f.node
          ? a.offset > f.offset
          : (a.node.compareDocumentPosition(f.node) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
      if (reverse) {
        range.setStart(f.node, f.offset);
        range.setEnd(a.node, a.offset);
      } else {
        range.setStart(a.node, a.offset);
        range.setEnd(f.node, f.offset);
      }
    } catch {
      return;
    }
    const native = globalThis.getSelection();
    native?.removeAllRanges();
    native?.addRange(range);
  }

  /** Selection-only update — do not remount DOM (preserves dblclick / caret). */
  updateSelection(state: EditorState): void {
    this.state = state;
    this.projecting = true;
    try {
      this.applyDomSelection();
    } finally {
      this.projecting = false;
    }
  }

  private clearWidgets(): void {
    for (const c of this.widgetCleanups.splice(0)) {
      c();
    }
  }

  private fingerprint(start: number, end: number): string {
    const blocks = this.state.doc.content ?? [];
    // Intentionally omit selection — caret moves must not wipe/remount the DOM.
    return JSON.stringify({
      end,
      slice: blocks.slice(start, end),
      start,
    });
  }

  private render(force: boolean): void {
    const blocks = this.state.doc.content ?? [],
      start = Math.max(0, this.viewportStart - this.options.overscan),
      end = Math.min(blocks.length, start + this.options.viewportSize + this.options.overscan * 2),
      fp = this.fingerprint(start, end);
    this.projecting = true;
    try {
      if (!force && fp === this.lastFingerprint) {
        this.applyDomSelection();
        return;
      }
      this.lastFingerprint = fp;
      this.clearWidgets();
      const slice = blocks.slice(start, end);
      this.content.dataset.range = `${start}:${end}`;
      replaceChildrenWithHtml(
        this.content,
        slice.map((b, i) => this.renderBlock(b, start + i)).join('') ||
          '<p data-ocm-block="0"><br></p>'
      );
      this.mountWidgets();
      this.applyDomSelection();
    } finally {
      this.projecting = false;
    }
  }

  private renderBlock(node: DocNode, index: number): string {
    const extra = blockDomAttrs(node);
    if (node.type === 'paragraph') {
      const inner = docToHTML({ ...node, type: 'paragraph' })
        .replace(/^<p[^>]*>/, '')
        .replace(/<\/p>$/, '');
      return `<p data-ocm-block="${index}" ${pathAttr([index])} data-type="paragraph"${extra}>${inner || '<br>'}</p>`;
    }
    if (node.type === 'heading') {
      const level = Number(node.attrs?.level ?? 1),
        tag = `h${Math.min(6, Math.max(1, level))}`,
        inner = (node.content ?? []).map((c) => docToHTML(c)).join('');
      return `<${tag} data-ocm-block="${index}" ${pathAttr([index])} data-type="heading"${extra}>${inner || '<br>'}</${tag}>`;
    }
    if (node.type === 'blockquote') {
      const inner = (node.content ?? []).map((c) => docToHTML(c)).join('');
      return `<blockquote data-ocm-block="${index}" ${pathAttr([index])} data-type="blockquote"${extra}>${inner || '<br>'}</blockquote>`;
    }
    if (node.type === 'codeBlock') {
      const lang = escapeAttr(asAttr(node.attrs?.language, 'text'));
      const code = escapeHTML((node.content ?? []).map((c) => c.text ?? '').join(''));
      return `<pre data-ocm-block="${index}" ${pathAttr([index])} data-type="codeBlock" data-language="${lang}" class="ocm-code-block"${extra}><code>${code || '<br>'}</code></pre>`;
    }
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      const tag = node.type === 'bulletList' ? 'ul' : 'ol',
        items = (node.content ?? [])
          .map((li, i) => {
            const inner = (li.content ?? []).map((c) => docToHTML(c)).join('');
            return `<li ${pathAttr([index, i])} data-type="listItem"${blockDomAttrs(li)}>${inner || '<br>'}</li>`;
          })
          .join('');
      return `<${tag} data-ocm-block="${index}" data-type="${node.type}"${extra}>${items}</${tag}>`;
    }
    if (node.type === 'table') {
      const rows = (node.content ?? [])
        .map((row, ri) => {
          const cells = (row.content ?? [])
            .map((cell, ci) => {
              const paras = cell.content ?? [];
              const inner =
                paras.length > 0
                  ? paras
                      .map((p, pi) => {
                        if (p.type !== 'paragraph') {
                          return docToHTML(p);
                        }
                        const html = (p.content ?? []).map((c) => docToHTML(c)).join('');
                        return `<p ${pathAttr([index, ri, ci, pi])} data-type="paragraph">${html || '<br>'}</p>`;
                      })
                      .join('')
                  : `<p ${pathAttr([index, ri, ci, 0])} data-type="paragraph"><br></p>`;
              const spanAttrs: string[] = [];
              const cs = Number(cell.attrs?.colspan ?? 1);
              const rs = Number(cell.attrs?.rowspan ?? 1);
              if (cs > 1) {
                spanAttrs.push(` colspan="${cs}"`);
              }
              if (rs > 1) {
                spanAttrs.push(` rowspan="${rs}"`);
              }
              if (cell.attrs?.merged === true) {
                return '';
              }
              return `<td data-type="tableCell"${spanAttrs.join('')}${blockDomAttrs(cell)}>${inner}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      return `<table class="html-editor-table not-prose${tableStyleClass(node)}" data-ocm-block="${index}" data-type="table" data-ocm-type="table"${blockDomAttrs(node)}><tbody>${rows}</tbody></table>`;
    }
    // Atom / unknown
    const attrs = encodeURIComponent(JSON.stringify(node.attrs ?? {}));
    return `<div data-ocm-block="${index}" ${pathAttr([index])} data-type="${escapeAttr(node.type)}" data-attrs="${attrs}" contenteditable="false" data-ocm-atom="1"></div>`;
  }

  private mountWidgets(): void {
    const atoms = this.content.querySelectorAll<HTMLElement>('[data-ocm-atom="1"]');
    for (const el of atoms) {
      const type = el.dataset.type ?? '',
        def = this.widgets.get(type);
      if (!def) {
        el.textContent = `[${type}]`;
        continue;
      }
      let attrs: Record<string, unknown> = {};
      try {
        const parsed: unknown = JSON.parse(decodeURIComponent(el.dataset.attrs ?? '%7B%7D'));
        attrs = isPlainObject(parsed) ? parsed : {};
      } catch {
        attrs = {};
      }
      const pathRaw = el.dataset.ocmPath ?? el.dataset.ocmBlock ?? '';
      const path = pathRaw.includes('.') ? pathRaw.split('.').map(Number) : [Number(pathRaw || 0)];

      const editor = this.getEditor?.() ?? null;
      const scope = new DisposableScope();
      const ctx: WidgetContext = {
        attrs,
        path,
        editor: editor as EditorAPI,
        scope,
        updateAttrs: (partial) => {
          if (!editor) {
            return;
          }
          editor.run(() => [{ type: 'set_attrs', path, attrs: partial }]);
        },
        openMenu: (items, x, y) => {
          editor?.ui.menu.open(items, x, y);
        },
      };
      const handle = mountView(el, def.render(attrs, ctx));
      this.widgetCleanups.push(() => {
        handle.destroy();
        scope.dispose();
      });
    }
  }
}

function pathAttr(p: number[]): string {
  return `data-ocm-path="${p.join('.')}"`;
}

function escapeAttr(s: string): string {
  return s.replaceAll('"', '&quot;');
}

function tableStyleClass(node: DocNode): string {
  const style = asAttr(node.attrs?.tableStyle, 'default');
  if (!style || style === 'default') {
    return '';
  }
  return ` table-${escapeAttr(style)}`;
}

/** Block-level attrs painted onto the host element (align / style / id / class). */
function blockDomAttrs(node: DocNode): string {
  const parts: string[] = [];
  const styleParts: string[] = [];
  const align = node.attrs?.align;
  if (align !== undefined && align !== null && align !== '') {
    styleParts.push(`text-align:${asAttr(align)}`);
  }
  const lineHeight = node.attrs?.lineHeight;
  if (lineHeight !== undefined && lineHeight !== null && lineHeight !== '') {
    styleParts.push(`line-height:${asAttr(lineHeight)}`);
  }
  const rawStyle = node.attrs?.style;
  if (typeof rawStyle === 'string' && rawStyle.trim()) {
    try {
      const parsed: unknown = JSON.parse(rawStyle);
      if (
        parsed !== null &&
        parsed !== undefined &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          const vs = asAttr(v);
          if (vs !== '') {
            styleParts.push(`${k}:${vs}`);
          }
        }
      } else {
        styleParts.push(rawStyle);
      }
    } catch {
      styleParts.push(rawStyle);
    }
  }
  if (styleParts.length > 0) {
    parts.push(`style="${escapeAttr(styleParts.join(';'))}"`);
  }
  const id = asAttr(node.attrs?.id);
  if (id !== '') {
    parts.push(`id="${escapeAttr(id)}"`);
  }
  const cls = asAttr(node.attrs?.class);
  if (cls !== '') {
    parts.push(`class="${escapeAttr(cls)}"`);
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

function findPathElement(content: HTMLElement, path: number[]): HTMLElement | null {
  if (path.length === 0) {
    return null;
  }
  const key = path.join('.');
  const byPath = content.querySelector(`[data-ocm-path="${key}"]`);
  if (byPath instanceof HTMLElement) {
    return byPath;
  }
  // Fallback: top-level block
  const block = content.querySelector(`[data-ocm-block="${path[0]}"]`);
  return block instanceof HTMLElement ? block : null;
}

function pathFromElement(el: HTMLElement): number[] {
  const raw = el.dataset.ocmPath;
  if (raw !== undefined && raw !== '') {
    return raw.split('.').map((n) => Number(n));
  }
  if (el.dataset.ocmBlock !== undefined) {
    return [Number(el.dataset.ocmBlock)];
  }
  return [0];
}

/** Resolve doc path from an atom host (or descendant). */
export function pathFromAtomEl(el: HTMLElement): number[] {
  const host =
    el.closest('[data-ocm-atom="1"]') instanceof HTMLElement
      ? (el.closest('[data-ocm-atom="1"]') as HTMLElement)
      : el;
  return pathFromElement(host);
}

export function textOffsetToDom(
  root: HTMLElement,
  offset: number
): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  let last: Text | null = null;
  while (node instanceof Text) {
    last = node;
    const len = node.data.length;
    if (remaining <= len) {
      return { node, offset: remaining };
    }
    remaining -= len;
    node = walker.nextNode();
  }
  if (last) {
    return { node: last, offset: last.data.length };
  }
  // Empty block (`<p><br></p>` / empty `<li>`) — caret on the element itself.
  return { node: root, offset: 0 };
}

export function domPointToOffset(root: HTMLElement, node: Node, offset: number): number {
  if (node === root) {
    return 0;
  }
  if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'BR') {
    return 0;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let cur = walker.nextNode();
  while (cur instanceof Text) {
    if (cur === node) {
      return total + offset;
    }
    if (node.nodeType === Node.ELEMENT_NODE && cur.parentNode === node) {
      if (offset === 0) {
        return total;
      }
    }
    total += cur.data.length;
    cur = walker.nextNode();
  }
  return total;
}

export function blockIndexFromTarget(content: HTMLElement, target: EventTarget | null): number {
  let el: Element | null = target instanceof Element ? target : null;
  while (el instanceof HTMLElement && el !== content) {
    const idx = el.dataset.ocmBlock;
    if (idx !== undefined) {
      return Number(idx);
    }
    el = el.parentElement;
  }
  return 0;
}

export function selectionFromDom(_content: HTMLElement): Selection | null {
  const native = globalThis.getSelection();
  if (!native || native.rangeCount === 0) {
    return null;
  }
  const range = native.getRangeAt(0);
  const startEl =
    range.startContainer instanceof Element
      ? range.startContainer.closest('[data-ocm-path],[data-ocm-block]')
      : range.startContainer.parentElement?.closest('[data-ocm-path],[data-ocm-block]');
  if (!(startEl instanceof HTMLElement)) {
    return null;
  }
  const path = pathFromElement(startEl);
  const anchor = domPointToOffset(startEl, range.startContainer, range.startOffset);
  const endEl =
    range.endContainer instanceof Element
      ? range.endContainer.closest('[data-ocm-path],[data-ocm-block]')
      : range.endContainer.parentElement?.closest('[data-ocm-path],[data-ocm-block]');
  const focusEl = endEl instanceof HTMLElement ? endEl : startEl;
  const focusPath = pathFromElement(focusEl);
  const focus = domPointToOffset(focusEl, range.endContainer, range.endOffset);
  return {
    anchor: { offset: anchor, path },
    focus: { offset: focus, path: focusPath },
  };
}
