import { docToHTML, htmlToDoc, docToPublishedHTML } from './html';
import { sanitizeHTML } from './sanitize';
import { docToMarkdown, markdownToDoc } from './markdown';
import type { PublishNodeDefinition } from '@on-codemerge/sdk';

export function importHTML(html: string) {
  return htmlToDoc(sanitizeHTML(html));
}

export function exportHTML(doc: Parameters<typeof docToHTML>[0]) {
  return docToHTML(doc);
}

export function exportPublishedHTML(
  doc: Parameters<typeof docToPublishedHTML>[0],
  publishers: Map<string, PublishNodeDefinition>
) {
  return docToPublishedHTML(doc, publishers);
}

export function importMarkdown(md: string) {
  return markdownToDoc(md);
}

export function exportMarkdown(doc: Parameters<typeof docToMarkdown>[0]) {
  return docToMarkdown(doc);
}

export { docToHTML, docToPublishedHTML, htmlToDoc } from './html';
export { docToMarkdown, markdownToDoc } from './markdown';
