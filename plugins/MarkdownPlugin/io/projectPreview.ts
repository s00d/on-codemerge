import type { DocNode } from '@codemerge/kernel';
import { docToHTML } from '@ocm/wysiwyg/io/html';
import { sanitizeHTML } from '@codemerge/sdk';
import { asAttr } from '@codemerge/sdk';
import { calloutHtml } from '../elements/builtins';
import type { MdElementButton, MdElementRegistry } from '../elements/types';
import { defaultMdElementRegistry } from '../elements/registry';
import { escapeHtml } from './escape';

export type ProjectPreviewOptions = {
  elements?: MdElementRegistry;
  /**
   * When false, skip sanitizeHTML (caller must sanitize once at the DOM sink).
   * Default true for string-export / publish callers.
   */
  sanitize?: boolean;
};

function readActions(raw: unknown): MdElementButton[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: MdElementButton[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object') {
      continue;
    }
    const label: unknown = Reflect.get(item, 'label');
    const href: unknown = Reflect.get(item, 'href');
    if (typeof label === 'string' && typeof href === 'string' && label.trim().length > 0) {
      out.push({ label: label.trim(), href });
    }
  }
  return out;
}

function projectBlock(node: DocNode, registry: MdElementRegistry): string {
  if (node.type === 'callout') {
    const variant = asAttr(node.attrs?.variant, 'info').toLowerCase() || 'info';
    const title = asAttr(node.attrs?.title);
    const def = registry.get(variant);
    const bodyHtml = (node.content ?? []).map((c) => projectBlock(c, registry)).join('');
    const block = { id: variant, title, body: '', buttons: readActions(node.attrs?.actions) };
    // Unregistered variant → builtin callout markup.
    return def ? def.toPreviewHtml(block, bodyHtml) : calloutHtml(variant, block, bodyHtml);
  }

  if (node.type === 'mermaid') {
    const source = typeof node.attrs?.source === 'string' ? node.attrs.source : '';
    // Source lives in <pre><code> (attrs are a poor fit for multiline).
    return `<div class="ocm-md-mermaid" data-node="mermaid" data-ocm-mermaid="1"><pre><code class="language-mermaid">${escapeHtml(source)}</code></pre></div>`;
  }

  // Known prose — reuse WYSIWYG HTML projector (no MD parse).
  return docToHTML(node);
}

/**
 * Project prose JSON SoT → preview HTML. Never parses Markdown.
 */
export function projectPreviewHtml(doc: DocNode, options: ProjectPreviewOptions = {}): string {
  const registry = options.elements ?? defaultMdElementRegistry;
  const root = doc.type === 'doc' ? doc : { type: 'doc', content: [doc] };
  const html = (root.content ?? []).map((n) => projectBlock(n, registry)).join('');
  if (options.sanitize === false) {
    return html;
  }
  return sanitizeHTML(html);
}
