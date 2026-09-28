import { escapeHtml } from '../io/escape';
import type { MdCustomElement, MdElementBlock, MdElementButton } from './types';

function buttonsHtml(buttons: MdElementButton[]): string {
  if (buttons.length === 0) {
    return '';
  }
  const items = buttons
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

/** Allow only relative, hash, http(s) — never javascript: / data: / protocol-relative. */
export function safeHref(href: string): string | null {
  const t = href.trim();
  if (!t) {
    return null;
  }
  if (t.startsWith('#') || (t.startsWith('/') && !t.startsWith('//'))) {
    return t;
  }
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  return null;
}

function calloutHtml(variant: string, block: MdElementBlock, bodyHtml: string): string {
  const title = block.title.trim()
    ? `<div class="ocm-md-callout__title">${escapeHtml(block.title.trim())}</div>`
    : '';
  const body = bodyHtml.trim() ? `<div class="ocm-md-callout__body">${bodyHtml}</div>` : '';
  return `<aside class="ocm-md-callout ocm-md-callout--${escapeHtml(variant)}" data-node="callout" data-variant="${escapeHtml(variant)}" data-ocm-callout="${escapeHtml(variant)}">${title}${body}${buttonsHtml(block.buttons)}</aside>`;
}

function callout(id: string, label: string, defaultTitle: string, order: number): MdCustomElement {
  return {
    id,
    label,
    order,
    defaultTitle,
    toPreviewHtml: (block, bodyHtml) => calloutHtml(id, block, bodyHtml),
  };
}

/** Built-in callouts shipped with MarkdownPlugin. */
export const BUILTIN_MD_ELEMENTS: MdCustomElement[] = [
  callout('info', 'Info', 'Info', 10),
  callout('warn', 'Warning', 'Warning', 20),
  callout('error', 'Error', 'Error', 30),
];
