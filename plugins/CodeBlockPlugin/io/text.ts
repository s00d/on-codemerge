import type { DocNode } from '@codemerge/kernel';
import { ParseError } from '@ocm/wysiwyg/utils/parseSoT';
import { textFromDoc, docFromText } from './adapters';

export const MAX_CODE_BYTES = 2_000_000;

/** Safe token for download extension / CSS `language-*` class. */
export function safeLangToken(lang: string): string {
  const t = lang.trim().toLowerCase();
  return /^[a-z0-9_+-]{1,32}$/.test(t) ? t : 'plaintext';
}

export type ParseTextResult = { ok: true; doc: DocNode } | { ok: false; error: ParseError };

export function parseText(text: string, language = 'plaintext'): ParseTextResult {
  if (text.length > MAX_CODE_BYTES) {
    return {
      ok: false,
      error: new ParseError(`Code exceeds ${MAX_CODE_BYTES} bytes`),
    };
  }
  return { ok: true, doc: docFromText(text, language) };
}

export function serializeText(doc: DocNode): string {
  return textFromDoc(doc);
}

export function serializeDoc(doc: DocNode): string {
  return serializeText(doc);
}
