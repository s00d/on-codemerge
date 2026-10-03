/**
 * Loaded via Vite `ssrLoadModule` from the DEV middleware.
 * Seeds JSDOM so `docToHTML` / `viewToHtml` can run; skips sanitize at this
 * boundary (DOM sink in the editor already sanitizes remote HTML).
 */
import { JSDOM } from 'jsdom';
import { markdownToDoc } from '@ocm/wysiwyg/io/markdown';
import { projectPreviewHtml } from '@ocm/markdown-plugin/io/projectPreview';
import { escapeHtml } from '@ocm/markdown-plugin/io/escape';

let domReady = false;

function ensureDom(): void {
  if (domReady) {
    return;
  }
  if (
    typeof globalThis.document !== 'undefined' &&
    typeof globalThis.document.createElement === 'function'
  ) {
    try {
      globalThis.document.createElement('div');
      domReady = true;
      return;
    } catch {
      /* replace broken stub */
    }
  }
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { window } = dom;
  Object.defineProperty(globalThis, 'window', { value: window, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: window.document, configurable: true });
  Object.defineProperty(globalThis, 'HTMLElement', {
    value: window.HTMLElement,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'Node', { value: window.Node, configurable: true });
  Object.defineProperty(globalThis, 'Element', { value: window.Element, configurable: true });
  domReady = true;
}

export function renderDevMdPreview(markdown: string): string {
  try {
    ensureDom();
    const html = projectPreviewHtml(markdownToDoc(markdown), { sanitize: false });
    if (html.trim().length > 0) {
      return html;
    }
  } catch (err) {
    console.warn('[ocm-docs-dev-api] MD projector failed, using escaped fallback', err);
  }
  return `<div class="ocm-md-dev-preview"><pre>${escapeHtml(markdown)}</pre></div>`;
}
