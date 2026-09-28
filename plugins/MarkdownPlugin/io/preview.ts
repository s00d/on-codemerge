import { markdownToDoc } from '@ocm/wysiwyg/io/markdown';
import type { MdElementRegistry } from '../elements/types';
import { defaultMdElementRegistry } from '../elements/registry';
import { projectPreviewHtml } from './projectPreview';

export { escapeHtml } from './escape';
export { projectPreviewHtml } from './projectPreview';

export type RenderMarkdownPreviewOptions = {
  elements?: MdElementRegistry;
};

/**
 * One-shot: Markdown string → prose tree → projector HTML.
 * Live workspace preview should call `projectPreviewHtml(state.doc)` instead.
 */
export function renderMarkdownPreviewHtml(
  md: string,
  options: RenderMarkdownPreviewOptions = {}
): string {
  const registry = options.elements ?? defaultMdElementRegistry;
  return projectPreviewHtml(markdownToDoc(md), { elements: registry });
}

/**
 * Attr-safe encoding (no raw newlines). JSON.stringify is reversible for
 * literal backslash-n sequences that naive `\n`↔newline maps corrupt.
 */
export function compactMarkdownText(raw: string): string {
  return JSON.stringify(raw);
}

/** Inverse of compactMarkdownText; falls back to legacy `\\n` expand. */
export function expandCompactMarkdownText(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'string') {
      return parsed;
    }
  } catch {
    // Legacy compact: newlines stored as two-char \n (lossy for literal \n).
  }
  return raw.replaceAll('\\n', '\n');
}

export function prettyMarkdownText(raw: string): string {
  if (!raw.endsWith('\n')) {
    return `${raw}\n`;
  }
  return raw;
}
