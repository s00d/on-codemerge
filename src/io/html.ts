import type { DocNode, Mark } from '@on-codemerge/kernel';
import { viewToHtml } from '@on-codemerge/sdk';
import type { PublishNodeDefinition } from '@on-codemerge/sdk';
import { asAttr } from '../utils/asAttr';
import { cssColorToHex } from '../utils/colorMath';
import { parseMath } from '../plugins/MathPlugin/utils/parse';
import { astToMathML } from '../plugins/MathPlugin/utils/mathml';

const MARK_TAG: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  strike: 's',
  underline: 'u',
};

/** Render document nodes to an HTML string (semantic export). */
export function docToHTML(doc: DocNode): string {
  return docToHTMLInner(doc, null);
}

/**
 * Published hydrate HTML: atoms with `publish.renderHtml` get rich markup;
 * everything else matches semantic `docToHTML`.
 */
export function docToPublishedHTML(
  doc: DocNode,
  publishers: Map<string, PublishNodeDefinition>
): string {
  return docToHTMLInner(doc, publishers);
}

function docToHTMLInner(
  doc: DocNode,
  publishers: Map<string, PublishNodeDefinition> | null
): string {
  if (doc.type === 'doc') {
    return (doc.content ?? []).map((n) => docToHTMLInner(n, publishers)).join('');
  }
  if (doc.type === 'paragraph') {
    const inner = (doc.content ?? []).map((n) => docToHTMLInner(n, publishers)).join('') || '<br>';
    return `<p>${inner}</p>`;
  }
  if (doc.type === 'heading') {
    const level = Math.min(6, Math.max(1, Number(doc.attrs?.level ?? 1)));
    const inner = (doc.content ?? []).map((n) => docToHTMLInner(n, publishers)).join('') || '<br>';
    return `<h${level}>${inner}</h${level}>`;
  }
  if (doc.type === 'bulletList' || doc.type === 'orderedList') {
    const tag = doc.type === 'bulletList' ? 'ul' : 'ol';
    const items = (doc.content ?? [])
      .map(
        (li) => `<li>${(li.content ?? []).map((n) => docToHTMLInner(n, publishers)).join('')}</li>`
      )
      .join('');
    return `<${tag}>${items}</${tag}>`;
  }
  if (doc.type === 'table') {
    const style = asAttr(doc.attrs?.tableStyle, 'default');
    const styleClass = style && style !== 'default' ? ` table-${escapeAttr(style)}` : '';
    const lazyAttrs: string[] = [];
    const lazyUrl = asAttr(doc.attrs?.lazyUrl);
    if (lazyUrl) {
      lazyAttrs.push(
        ` data-lazy-url="${escapeAttr(lazyUrl)}"`,
        ` data-lazy-format="${escapeAttr(asAttr(doc.attrs?.lazyFormat, 'json'))}"`,
        ` data-lazy-headers="${doc.attrs?.lazyHeaders === false ? 'false' : 'true'}"`
      );
      const delim = asAttr(doc.attrs?.lazyDelimiter, ',');
      if (delim && delim !== ',') {
        lazyAttrs.push(` data-lazy-delimiter="${escapeAttr(delim)}"`);
      }
    }
    if (doc.attrs?.hasHeader === true) {
      lazyAttrs.push(' data-has-header="true"');
    }
    if (doc.attrs?.responsive === true) {
      lazyAttrs.push(' data-responsive="true"');
    }
    if (doc.attrs?.autofit === true) {
      lazyAttrs.push(' data-autofit="true"');
    }
    if (doc.id) {
      lazyAttrs.push(` data-table-id="${escapeAttr(doc.id)}"`);
    }
    const rows = (doc.content ?? [])
      .map((row, ri) => {
        const isHeader = row.attrs?.header === true || (doc.attrs?.hasHeader === true && ri === 0);
        const cells = (row.content ?? [])
          .filter((cell) => cell.attrs?.merged !== true)
          .map((cell) => {
            const tag = isHeader ? 'th' : 'td';
            const spanAttrs: string[] = [];
            const cs = Number(cell.attrs?.colspan ?? 1);
            const rs = Number(cell.attrs?.rowspan ?? 1);
            if (cs > 1) {
              spanAttrs.push(` colspan="${cs}"`);
            }
            if (rs > 1) {
              spanAttrs.push(` rowspan="${rs}"`);
            }
            return `<${tag}${spanAttrs.join('')}>${(cell.content ?? []).map((n) => docToHTMLInner(n, publishers)).join('') || '<br>'}</${tag}>`;
          })
          .join('');
        const rowAttr = row.attrs?.header === true ? ' data-header="true"' : '';
        return `<tr${rowAttr}>${cells}</tr>`;
      })
      .join('');
    return `<table class="html-editor-table not-prose${styleClass}"${lazyAttrs.join('')}><tbody>${rows}</tbody></table>`;
  }
  if (doc.type === 'codeBlock' || doc.type === 'code_block') {
    const lang = escapeAttr(asAttr(doc.attrs?.language, 'plaintext'));
    const code =
      typeof doc.attrs?.code === 'string'
        ? escapeHTML(doc.attrs.code)
        : escapeHTML((doc.content ?? []).map((c) => c.text ?? '').join(''));
    return `<pre data-language="${lang}"><code>${code}</code></pre>`;
  }
  if (doc.type === 'blockquote') {
    return `<blockquote>${(doc.content ?? []).map((n) => docToHTMLInner(n, publishers)).join('')}</blockquote>`;
  }
  if (doc.type === 'horizontalRule') {
    return '<hr />';
  }
  if (doc.type === 'image') {
    const src = escapeAttr(allowedLinkHref(asAttr(doc.attrs?.src)));
    const alt = escapeAttr(asAttr(doc.attrs?.alt));
    const width = Number(doc.attrs?.width ?? 0);
    const height = Number(doc.attrs?.height ?? 0);
    const size = (width > 0 ? ` width="${width}"` : '') + (height > 0 ? ` height="${height}"` : '');
    const dataAttrs = Object.entries(doc.attrs ?? {})
      .filter(([k]) => !['src', 'alt', 'width', 'height'].includes(k))
      .map(([k, v]) => ` data-${escapeAttr(camelToKebab(k))}="${escapeAttr(asAttr(v))}"`)
      .join('');
    return `<img src="${src}" alt="${alt}"${size}${dataAttrs} />`;
  }
  if (doc.type === 'text') {
    let html = escapeHTML(doc.text ?? '');
    for (const mark of doc.marks ?? []) {
      html = wrapMark(mark, html);
    }
    return html;
  }
  if (doc.type === 'math') {
    const attrs = Object.entries(doc.attrs ?? {})
      .map(([k, v]) => ` data-${escapeAttr(camelToKebab(k))}="${escapeAttr(asAttr(v))}"`)
      .join('');
    const expressionRaw = doc.attrs?.expression;
    const expression = typeof expressionRaw === 'string' ? expressionRaw : '';
    let inner = '';
    if (typeof document !== 'undefined' && expression) {
      const parsed = parseMath(expression);
      if (parsed.ok) {
        inner = astToMathML(parsed.ast).outerHTML;
      }
    }
    return `<div data-node="math"${attrs}>${inner}</div>`;
  }
  if (doc.attrs && doc.type) {
    const pub = publishers?.get(doc.type);
    if (pub) {
      return viewToHtml(pub.render({ ...doc.attrs }));
    }
    // Atom / unknown block: data attributes (kebab-case keys for HTML round-trip)
    const attrs = Object.entries(doc.attrs)
      .map(([k, v]) => ` data-${escapeAttr(camelToKebab(k))}="${escapeAttr(asAttr(v))}"`)
      .join('');
    return `<div data-node="${escapeAttr(doc.type)}"${attrs}></div>`;
  }
  return (doc.content ?? []).map((n) => docToHTMLInner(n, publishers)).join('');
}

export function escapeHTML(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(text: string): string {
  return escapeHTML(text).replaceAll("'", '&#39;');
}

function allowedLinkHref(raw: string): string {
  const href = raw.trim();
  if (!href) {
    return '';
  }
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href)?.[1]?.toLowerCase();
  if (!scheme) {
    return href;
  }
  if (scheme === 'http' || scheme === 'https' || scheme === 'mailto') {
    return href;
  }
  return '';
}

function safeCssColor(raw: string): string {
  const v = raw.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) {
    return v;
  }
  if (/^rgba?\(\s*[\d.\s%,]+\)$/.test(v)) {
    return v;
  }
  if (/^[a-zA-Z]+$/.test(v)) {
    return v;
  }
  return '';
}

function safeCssSize(raw: string): string {
  const v = raw.trim();
  if (/^\d+(\.\d+)?(px|em|rem|%)$/.test(v)) {
    return v;
  }
  return '';
}

function safeCssFont(raw: string): string {
  const v = raw.trim();
  if (/^[a-zA-Z0-9\s,"'-]+$/.test(v) && !/[;{}()]/.test(v)) {
    return v;
  }
  return '';
}

function wrapMark(mark: Mark, html: string): string {
  const a = mark.attrs ?? {};
  switch (mark.type) {
    case 'bold': {
      return `<strong>${html}</strong>`;
    }
    case 'italic': {
      return `<em>${html}</em>`;
    }
    case 'strike': {
      return `<s>${html}</s>`;
    }
    case 'underline': {
      return `<u>${html}</u>`;
    }
    case 'link': {
      const href = escapeAttr(allowedLinkHref(asAttr(a.href)));
      const title = asAttr(a.title) ? ` title="${escapeAttr(asAttr(a.title))}"` : '';
      const target = asAttr(a.target) ? ` target="${escapeAttr(asAttr(a.target))}"` : '';
      const rel = asAttr(a.rel) ? ` rel="${escapeAttr(asAttr(a.rel))}"` : '';
      return `<a href="${href}"${title}${target}${rel}>${html}</a>`;
    }
    case 'textColor': {
      const color = safeCssColor(asAttr(a.color));
      return color ? `<span style="color:${escapeAttr(color)}">${html}</span>` : html;
    }
    case 'highlight': {
      const color = safeCssColor(asAttr(a.color));
      return color ? `<span style="background-color:${escapeAttr(color)}">${html}</span>` : html;
    }
    case 'fontFamily': {
      const family = safeCssFont(asAttr(a.family));
      return family ? `<span style="font-family:${escapeAttr(family)}">${html}</span>` : html;
    }
    case 'fontSize': {
      const size = safeCssSize(asAttr(a.size));
      return size ? `<span style="font-size:${escapeAttr(size)}">${html}</span>` : html;
    }
    case 'comment': {
      return `<mark data-comment="${escapeAttr(asAttr(a.id))}" title="${escapeAttr(asAttr(a.text))}">${html}</mark>`;
    }
    case 'mention': {
      return `<span class="ocm-mention" data-mention-id="${escapeAttr(asAttr(a.id))}">${html}</span>`;
    }
    case 'footnote': {
      return `<sup class="ocm-footnote" data-footnote="${escapeAttr(asAttr(a.id))}">${html}</sup>`;
    }
    case 'insertion': {
      return `<span class="tracked-insert" data-mark="insertion">${html}</span>`;
    }
    case 'deletion': {
      return `<span class="tracked-delete" data-mark="deletion">${html}</span>`;
    }
    case 'misspelled': {
      return `<span class="misspelled-word" data-mark="misspelled">${html}</span>`;
    }
    case 'code': {
      return `<code>${html}</code>`;
    }
    default: {
      const tag = MARK_TAG[mark.type] ?? 'span';
      return `<${tag} data-mark="${escapeAttr(mark.type)}">${html}</${tag}>`;
    }
  }
}

/** Naive HTML → doc import (paragraphs + basic marks). Sanitize upstream. */
export function htmlToDoc(html: string): DocNode {
  const wrapped = `<div id="root">${html}</div>`,
    parser = typeof DOMParser === 'undefined' ? null : new DOMParser();
  if (!parser) {
    return {
      content: [{ type: 'paragraph', content: [{ type: 'text', text: stripTags(html) }] }],
      type: 'doc',
    };
  }
  const dom = parser.parseFromString(wrapped, 'text/html'),
    root = dom.querySelector('#root') ?? dom.body,
    content: DocNode[] = [];
  for (const child of root.childNodes) {
    const block = parseBlock(child);
    if (block) {
      content.push(block);
    }
  }
  if (content.length === 0) {
    content.push({ content: [{ type: 'text', text: '' }], type: 'paragraph' });
  }
  return { content, type: 'doc' };
}

function camelToKebab(key: string): string {
  return key.replaceAll(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function kebabToCamel(key: string): string {
  return key.replaceAll(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function parseDataAttrs(el: HTMLElement): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const { name, value } of el.attributes) {
    if (name === 'data-node' || !name.startsWith('data-')) {
      continue;
    }
    const key = kebabToCamel(name.slice(5));
    if (value === 'true') {
      attrs[key] = true;
    } else if (value === 'false') {
      attrs[key] = false;
    } else if (value !== '' && !Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value)) {
      attrs[key] = Number(value);
    } else {
      attrs[key] = value;
    }
  }
  return attrs;
}

function parseBlock(node: ChildNode): DocNode | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent ?? '';
    if (!t.trim()) {
      return null;
    }
    return { content: [{ type: 'text', text: t }], type: 'paragraph' };
  }
  if (!(node instanceof HTMLElement)) {
    return null;
  }
  const el = node,
    tag = el.tagName.toLowerCase();
  if (el.dataset.node) {
    return { type: el.dataset.node, attrs: parseDataAttrs(el) };
  }
  if (tag === 'pre') {
    const codeEl = el.querySelector('code');
    const language = el.dataset.language ?? 'plaintext';
    const code = codeEl?.textContent ?? el.textContent ?? '';
    return { type: 'code_block', attrs: { language, code } };
  }
  if (tag === 'p' || tag === 'div') {
    return { content: parseInline(el), type: 'paragraph' };
  }
  if (/^h[1-6]$/.test(tag)) {
    return {
      attrs: { level: Number(tag.slice(1)) },
      content: parseInline(el),
      type: 'heading',
    };
  }
  if (tag === 'ul' || tag === 'ol') {
    const items = [...el.children]
      .filter((c): c is HTMLElement => c instanceof HTMLElement && c.tagName.toLowerCase() === 'li')
      .map((li) => ({ content: parseInline(li), type: 'listItem' }));
    return {
      content:
        items.length > 0 ? items : [{ content: [{ type: 'text', text: '' }], type: 'listItem' }],
      type: tag === 'ul' ? 'bulletList' : 'orderedList',
    };
  }
  if (tag === 'table') {
    const rawRows = [...el.querySelectorAll(':scope > tbody > tr, :scope > tr')];
    const hasHeaderAttr = el.dataset.hasHeader === 'true';
    const hasTh = Boolean(el.querySelector(':scope th'));
    const hasHeader = hasHeaderAttr || hasTh;
    const rows = rawRows.map((tr, ri) => {
      const isHeaderRow =
        hasHeader && (ri === 0 || (tr instanceof HTMLElement && tr.dataset.header === 'true'));
      const cells = [...tr.children]
        .filter((c): c is HTMLElement => {
          if (!(c instanceof HTMLElement)) {
            return false;
          }
          const t = c.tagName.toLowerCase();
          return t === 'td' || t === 'th';
        })
        .map((cellEl) => {
          const cellAttrs: Record<string, unknown> = {};
          const cs = Number(cellEl.getAttribute('colspan') || cellEl.dataset.colspan || 1);
          const rs = Number(cellEl.getAttribute('rowspan') || cellEl.dataset.rowspan || 1);
          if (cs > 1) {
            cellAttrs.colspan = cs;
          }
          if (rs > 1) {
            cellAttrs.rowspan = rs;
          }
          return {
            attrs: Object.keys(cellAttrs).length > 0 ? cellAttrs : undefined,
            content: [
              {
                content: parseInline(cellEl),
                type: 'paragraph',
              },
            ],
            type: 'tableCell',
          };
        });
      return {
        attrs: isHeaderRow ? { header: true } : undefined,
        content: cells,
        type: 'tableRow',
      };
    });
    const cols = Math.max(
      2,
      ...rows.map((row) =>
        (row.content ?? []).reduce(
          (n, cell) => n + Math.max(1, Number(cell.attrs?.colspan ?? 1)),
          0
        )
      )
    );
    const lazyUrl = el.dataset.lazyUrl ?? '';
    const attrs: Record<string, unknown> = { cols };
    if (hasHeader) {
      attrs.hasHeader = true;
    }
    if (el.dataset.responsive === 'true') {
      attrs.responsive = true;
    }
    if (el.dataset.autofit === 'true') {
      attrs.autofit = true;
    }
    if (lazyUrl) {
      attrs.lazyUrl = lazyUrl;
      attrs.lazyFormat = el.dataset.lazyFormat === 'csv' ? 'csv' : 'json';
      attrs.lazyHeaders = el.dataset.lazyHeaders !== 'false';
      attrs.lazyDelimiter = el.dataset.lazyDelimiter || ',';
    }
    const style = /\btable-(\w+)\b/.exec(el.className)?.[1];
    if (style && style !== 'default') {
      attrs.tableStyle = style;
    }
    const tableId = el.dataset.tableId || `table_${Date.now()}`;
    return {
      attrs,
      content:
        rows.length > 0
          ? rows
          : [
              {
                content: [
                  {
                    content: [{ content: [{ type: 'text', text: '' }], type: 'paragraph' }],
                    type: 'tableCell',
                  },
                  {
                    content: [{ content: [{ type: 'text', text: '' }], type: 'paragraph' }],
                    type: 'tableCell',
                  },
                ],
                type: 'tableRow',
              },
            ],
      id: tableId,
      type: 'table',
    };
  }
  if (tag === 'br') {
    return { content: [{ type: 'text', text: '' }], type: 'paragraph' };
  }
  if (tag === 'blockquote') {
    const inner = [...el.childNodes]
      .map((c) => parseBlock(c))
      .filter((b): b is DocNode => b !== null);
    return {
      type: 'blockquote',
      content: inner.length > 0 ? inner : [{ type: 'paragraph', content: parseInline(el) }],
    };
  }
  if (tag === 'hr') {
    return { type: 'horizontalRule', attrs: {} };
  }
  if (tag === 'img') {
    const attrs: Record<string, unknown> = {
      ...parseDataAttrs(el),
      src: allowedLinkHref(el.getAttribute('src') ?? ''),
      alt: el.getAttribute('alt') ?? '',
    };
    const w = Number(el.getAttribute('width') || el.dataset.width || 0);
    const h = Number(el.getAttribute('height') || el.dataset.height || 0);
    if (w > 0) {
      attrs.width = w;
    }
    if (h > 0) {
      attrs.height = h;
    }
    return { type: 'image', attrs };
  }
  // Fallback: treat as paragraph
  return { content: parseInline(el), type: 'paragraph' };
}

function parseInline(el: HTMLElement): DocNode[] {
  const out: DocNode[] = [],
    walk = (n: ChildNode, marks: Mark[]) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const text = n.textContent ?? '';
        if (text.length > 0) {
          out.push({ type: 'text', text, marks: marks.length > 0 ? marks : undefined });
        }
        return;
      }
      if (!(n instanceof HTMLElement)) {
        return;
      }
      const e = n,
        tag = e.tagName.toLowerCase(),
        next = [...marks];
      if (tag === 'strong' || tag === 'b') {
        next.push({ type: 'bold' });
      }
      if (tag === 'em' || tag === 'i') {
        next.push({ type: 'italic' });
      }
      if (tag === 'u') {
        next.push({ type: 'underline' });
      }
      if (tag === 's' || tag === 'strike') {
        next.push({ type: 'strike' });
      }
      if (tag === 'a') {
        const href = allowedLinkHref(e.getAttribute('href') ?? '');
        const title = e.getAttribute('title') ?? undefined;
        const target = e.getAttribute('target') ?? undefined;
        const rel = e.getAttribute('rel') ?? undefined;
        const attrs: Record<string, unknown> = { href };
        if (title) {
          attrs.title = title;
        }
        if (target) {
          attrs.target = target;
        }
        if (rel) {
          attrs.rel = rel;
        }
        next.push({ type: 'link', attrs });
      }
      if (tag === 'code') {
        next.push({ type: 'code' });
      }
      if (tag === 'mark' && e.hasAttribute('data-comment')) {
        next.push({
          type: 'comment',
          attrs: { id: e.getAttribute('data-comment') ?? '', text: e.getAttribute('title') ?? '' },
        });
      }
      if (tag === 'sup' || (tag === 'span' && e.classList.contains('ocm-footnote'))) {
        const fid = e.getAttribute('data-footnote');
        if (fid !== null) {
          next.push({ type: 'footnote', attrs: { id: fid } });
        }
      }
      if (tag === 'span' && e.classList.contains('ocm-mention')) {
        next.push({
          type: 'mention',
          attrs: { id: e.getAttribute('data-mention-id') ?? '' },
        });
      }
      if (tag === 'span' || tag === 'mark') {
        const markType = e.getAttribute('data-mark');
        if (markType === 'insertion' || markType === 'deletion' || markType === 'misspelled') {
          next.push({ type: markType });
        } else if (
          markType &&
          !['bold', 'italic', 'underline', 'strike', 'link'].includes(markType)
        ) {
          next.push({ type: markType });
        }
      }
      if (tag === 'span') {
        const color = cssColorToHex(e.style.color);
        if (color) {
          next.push({ type: 'textColor', attrs: { color } });
        }
        const bg = cssColorToHex(e.style.backgroundColor);
        if (bg) {
          next.push({ type: 'highlight', attrs: { color: bg } });
        }
        const family = e.style.fontFamily?.replaceAll(/['"]/g, '').trim();
        if (family) {
          next.push({ type: 'fontFamily', attrs: { family } });
        }
        const size = e.style.fontSize?.trim();
        if (size) {
          next.push({ type: 'fontSize', attrs: { size } });
        }
      }
      if (tag === 'br') {
        out.push({ marks: marks.length > 0 ? marks : undefined, text: '\n', type: 'text' });
        return;
      }
      for (const c of e.childNodes) {
        walk(c, next);
      }
    };
  for (const c of el.childNodes) {
    walk(c, []);
  }
  if (out.length === 0) {
    out.push({ type: 'text', text: '' });
  }
  return out;
}

function stripTags(html: string): string {
  return html.replaceAll(/<[^>]+>/g, '');
}
