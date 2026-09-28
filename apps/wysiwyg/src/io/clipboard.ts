import { sanitizeHTML } from './sanitize';
import { htmlToDoc, docToHTML } from './html';
import type { DocNode } from '@on-codemerge/kernel';

export interface ClipboardPayload {
  html?: string;
  text?: string;
  json?: string;
}

/** Read paste event into a document fragment (sanitized). */
export function pasteToDoc(payload: ClipboardPayload): DocNode {
  if (payload.html) {
    return htmlToDoc(sanitizeHTML(payload.html));
  }
  const text = payload.text ?? '';
  return {
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
    ],
    type: 'doc',
  };
}

export function docToClipboard(doc: DocNode): ClipboardPayload {
  return {
    html: docToHTML(doc),
    json: JSON.stringify({ version: 1, doc }),
    text: docToHTML(doc).replaceAll(/<[^>]+>/g, ''),
  };
}
