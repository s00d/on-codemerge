import type { DocNode } from '@on-codemerge/kernel';
import { docToHTML } from '@ocm/wysiwyg/io/html';
import { sanitizeHTML } from '@ocm/wysiwyg/io/sanitize';
import { asAttr } from '@ocm/wysiwyg/utils/asAttr';
import { safeHref } from '../elements/builtins';
import type { MdElementRegistry } from '../elements/types';
import { defaultMdElementRegistry } from '../elements/registry';
import { escapeHtml } from './escape';

export type ProjectPreviewOptions = {
  elements?: MdElementRegistry;
};

type CalloutAction = { label: string; href: string };

function readActions(raw: unknown): CalloutAction[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: CalloutAction[] = [];
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

function buttonsHtml(actions: CalloutAction[]): string {
  if (actions.length === 0) {
    return '';
  }
  const items = actions
    .map((b) => {
      const href = safeHref(b.href);
      if (!href) {
        return '';
      }
      return `<a class="ocm-md-callout__btn" href="${escapeHtml(href)}">${escapeHtml(b.label)}</a>`;
    })
    .filter(Boolean)
    .join('');
  if (!items) {
    return '';
  }
  return `<div class="ocm-md-callout__actions">${items}</div>`;
}

function projectBlock(node: DocNode, registry: MdElementRegistry): string {
  if (node.type === 'callout') {
    const variant = asAttr(node.attrs?.variant, 'info').toLowerCase() || 'info';
    const title = asAttr(node.attrs?.title);
    const def = registry.get(variant);
    const bodyHtml = (node.content ?? []).map((c) => projectBlock(c, registry)).join('');
    if (def) {
      return def.toPreviewHtml(
        {
          id: variant,
          title,
          body: '',
          buttons: readActions(node.attrs?.actions),
        },
        bodyHtml
      );
    }
    const titleHtml = title.trim()
      ? `<div class="ocm-md-callout__title">${escapeHtml(title.trim())}</div>`
      : '';
    const body = bodyHtml.trim() ? `<div class="ocm-md-callout__body">${bodyHtml}</div>` : '';
    return `<aside class="ocm-md-callout ocm-md-callout--${escapeHtml(variant)}" data-node="callout" data-variant="${escapeHtml(variant)}">${titleHtml}${body}${buttonsHtml(readActions(node.attrs?.actions))}</aside>`;
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
  return sanitizeHTML(html);
}
