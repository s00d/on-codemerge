import type { DocNode } from '@codemerge/kernel';
import { ParseError } from '@ocm/wysiwyg/utils/parseSoT';
import { docToMarkdown, markdownToDoc } from '@ocm/wysiwyg/io/markdown';
import { docToText, emptyEditorDoc } from './adapters';

export type ParseTextResult =
  | { ok: true; doc: DocNode; value: string }
  | { ok: false; error: ParseError };

const MAX_MD_BYTES = 1_000_000;

/** Markdown source → prose JSON SoT. Fails only on size cap. */
export function parseText(text: string): ParseTextResult {
  if (text.length > MAX_MD_BYTES) {
    return { ok: false, error: new ParseError('Markdown too large') };
  }
  const doc = markdownToDoc(text);
  return { ok: true, doc, value: text };
}

export function serializeText(text: string): string {
  return text;
}

export function serializeDoc(doc: DocNode): string {
  return serializeText(docToText(doc));
}

/** Rebuild SoT from a plain string (caller already size-checked). */
export function textToEditorDoc(text: string): DocNode {
  return emptyEditorDoc(text);
}

export { docToMarkdown, markdownToDoc };
