/**
 * Allowlist HTML/SVG sanitizer (no DOMPurify).
 * Parse → walk → drop bad tags/attrs → serialize. Used at IO / hydrate boundaries.
 */

const HTML_TAGS = new Set([
  'a',
  'abbr',
  'aside',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'col',
  'colgroup',
  'del',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

// Lowercase names — tagName() lowercases nodeName (foreignObject → foreignobject).
const SVG_TAGS = new Set([
  'svg',
  'g',
  'a',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'clippath',
  'mask',
  'lineargradient',
  'radialgradient',
  'stop',
  'marker',
  'use',
  'symbol',
  'title',
  'desc',
  'foreignobject',
  'style',
]);

const GLOBAL_ATTRS = new Set([
  'class',
  'id',
  'title',
  'role',
  'lang',
  'dir',
  'aria-label',
  'aria-hidden',
  'data-node',
  'data-variant',
  'data-ocm-mermaid',
  'data-ocm-mermaid-ready',
  'data-ocm-runtime',
  'data-ocm-config',
]);

const HTML_ATTRS: Record<string, ReadonlySet<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
  col: new Set(['span']),
  code: new Set(['class']),
  pre: new Set(['class']),
  div: new Set(['class']),
  span: new Set(['class', 'style']),
  aside: new Set(['class']),
};

const SVG_ATTRS = new Set([
  'class',
  'id',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'transform',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'viewBox',
  'xmlns',
  'xmlns:xlink',
  'preserveAspectRatio',
  'text-anchor',
  'dominant-baseline',
  'alignment-baseline',
  'font-size',
  'font-family',
  'font-weight',
  'xml:space',
  'style',
  'clip-path',
  'mask',
  'marker-start',
  'marker-end',
  'marker-mid',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientUnits',
  'gradientTransform',
  'xlink:href',
  'href',
  'points',
  'dx',
  'dy',
]);

function tagName(node: Element): string {
  return node.nodeName.toLowerCase();
}

function isAllowedTag(name: string, svg: boolean): boolean {
  if (name === 'script' || name === 'iframe' || name === 'object' || name === 'embed') {
    return false;
  }
  if (svg) {
    return SVG_TAGS.has(name) || HTML_TAGS.has(name);
  }
  return HTML_TAGS.has(name);
}

function isSafeUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  // eslint-disable-next-line no-script-url -- allowlist reject, not navigate
  if (v.startsWith('javascript:') || v.startsWith('vbscript:') || v.startsWith('data:text/html')) {
    return false;
  }
  return true;
}

/** Drop scripts + on* / javascript: URLs in an already-built subtree. */
function stripDangerous(root: Element): void {
  for (const el of root.querySelectorAll('script')) {
    el.remove();
  }
  for (const el of root.querySelectorAll('*')) {
    for (let i = el.attributes.length - 1; i >= 0; i -= 1) {
      const attr = el.attributes.item(i);
      if (!attr) {
        continue;
      }
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((name === 'href' || name === 'src' || name === 'xlink:href') && !isSafeUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }
}

function isAllowedAttr(tag: string, attr: string, value: string, svg: boolean): boolean {
  const name = attr.toLowerCase();
  if (name.startsWith('on')) {
    return false;
  }
  if (GLOBAL_ATTRS.has(name) || name.startsWith('data-')) {
    return true;
  }
  if (name === 'href' || name === 'src' || name === 'xlink:href') {
    return isSafeUrl(value);
  }
  if (svg && SVG_ATTRS.has(name)) {
    return true;
  }
  const allowed = HTML_ATTRS[tag];
  return allowed?.has(name) ?? false;
}

function copySafeAttrs(from: Element, to: Element, svg: boolean): void {
  const tag = tagName(from);
  for (let i = 0; i < from.attributes.length; i += 1) {
    const attr = from.attributes.item(i);
    if (!attr) {
      continue;
    }
    if (!isAllowedAttr(tag, attr.name, attr.value, svg)) {
      continue;
    }
    to.setAttribute(attr.name, attr.value);
  }
}

function createCleanElement(doc: Document, el: Element, inSvg: boolean): Element {
  const name = tagName(el);
  if (name === 'svg') {
    return doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  }
  // HTML labels inside <foreignObject> must stay in HTML namespace.
  const htmlOnly = HTML_TAGS.has(name) && !SVG_TAGS.has(name);
  if (inSvg && !htmlOnly) {
    return doc.createElementNS('http://www.w3.org/2000/svg', el.localName);
  }
  return doc.createElement(name);
}

/** Append a sanitized node; unknown tags unwrap (keep text) instead of dropping. */
function appendSanitized(parent: ParentNode, node: Node, doc: Document, svg: boolean): void {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
    parent.append(doc.createTextNode(node.textContent ?? ''));
    return;
  }
  if (!(node.nodeType === Node.ELEMENT_NODE && node instanceof Element)) {
    return;
  }
  const name = tagName(node);
  const inSvg = svg || name === 'svg';
  if (!isAllowedTag(name, inSvg)) {
    for (const child of node.childNodes) {
      appendSanitized(parent, child, doc, svg);
    }
    return;
  }
  // foreignObject holds XHTML labels — import subtree, then strip handlers.
  if (name === 'foreignobject') {
    const next = doc.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    copySafeAttrs(node, next, true);
    for (const child of node.childNodes) {
      next.append(doc.importNode(child, true));
    }
    stripDangerous(next);
    parent.append(next);
    return;
  }
  const next = createCleanElement(doc, node, inSvg);
  copySafeAttrs(node, next, inSvg);
  for (const child of node.childNodes) {
    appendSanitized(next, child, doc, inSvg);
  }
  parent.append(next);
}

/** Parse HTML fragment → sanitized DocumentFragment (owner = current document). */
export function parseSafeHtml(html: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  if (typeof DOMParser === 'undefined') {
    return frag;
  }
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  for (const child of parsed.body.childNodes) {
    appendSanitized(frag, child, document, false);
  }
  return frag;
}

/** Serialize a fragment to HTML string (boundary export). */
export function serializeFragment(frag: DocumentFragment): string {
  const wrap = document.createElement('div');
  wrap.append(frag.cloneNode(true));
  return wrap.innerHTML;
}

/** Allowlist-sanitize an HTML string. */
export function sanitizeHTML(dirty: string): string {
  if (globalThis.window === undefined) {
    return '';
  }
  return serializeFragment(parseSafeHtml(dirty));
}

/**
 * Parse + allowlist-sanitize an SVG string → live SVGElement (or null).
 * Keeps foreignObject XHTML label children.
 */
export function parseSafeSvg(svg: string): SVGElement | null {
  if (typeof DOMParser === 'undefined') {
    return null;
  }
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = parsed.documentElement;
  if (root === null || root.nodeName === 'parsererror' || tagName(root) !== 'svg') {
    return null;
  }
  const wrap = document.createDocumentFragment();
  appendSanitized(wrap, root, document, true);
  const cleaned = wrap.firstElementChild;
  return cleaned instanceof SVGElement ? cleaned : null;
}

/** Replace element children with a sanitized HTML fragment. */
export function replaceChildrenWithSafeHtml(el: HTMLElement, html: string): void {
  const frag = parseSafeHtml(html);
  el.replaceChildren(...frag.childNodes);
}
