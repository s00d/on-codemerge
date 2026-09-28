import type { DocNode } from '@on-codemerge/kernel';
import { docToMarkdown, markdownToDoc } from '@ocm/wysiwyg/io/markdown';

/** Block types allowed at the top level of a Markdown Editor SoT. */
export const MD_BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'code_block',
  'horizontalRule',
  'callout',
  'mermaid',
  'table',
  'tableRow',
  'tableCell',
  'image',
]);

/**
 * True when SoT is a prose `doc` (not the legacy `doc → markdown.text` blob).
 */
export function isMarkdownEditorDoc(doc: DocNode): boolean {
  if (doc.type !== 'doc') {
    return false;
  }
  const kids = doc.content ?? [];
  if (kids.length === 0) {
    return false;
  }
  // Legacy blob SoT — reject.
  if (kids.length === 1 && kids[0]?.type === 'markdown') {
    return false;
  }
  return kids.every((k) => MD_BLOCK_TYPES.has(k.type));
}

/** Seed / empty SoT from plain Markdown (parses into prose JSON tree). */
export function emptyEditorDoc(text = ''): DocNode {
  return markdownToDoc(text);
}

/** Persist string from SoT (serialize prose tree → Markdown). */
export function docToText(doc: DocNode): string {
  return docToMarkdown(doc);
}
