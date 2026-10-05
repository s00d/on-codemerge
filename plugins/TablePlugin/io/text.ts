import type { DocNode } from '@codemerge/kernel';
import { ParseError, parseJsonPayload } from '@codemerge/kernel';
import {
  docFromGrid,
  emptyTableGrid,
  gridFromDoc,
  isTableGridDoc,
  normalizeTableGrid,
} from './adapters';
import { MAX_TABLE_BYTES } from './constants';

export { MAX_TABLE_BYTES };

export type ParseTextResult = { ok: true; doc: DocNode } | { ok: false; error: ParseError };

export function parseText(text: string): ParseTextResult {
  const parsed = parseJsonPayload(
    text,
    MAX_TABLE_BYTES,
    `Table JSON exceeds ${MAX_TABLE_BYTES} bytes`
  );
  if (!parsed.ok) {
    return { ok: false, error: new ParseError(parsed.message) };
  }
  if (parsed.empty) {
    return { ok: true, doc: docFromGrid(emptyTableGrid()) };
  }
  if (!isTableGridDoc(parsed.value)) {
    return {
      ok: false,
      error: new ParseError('Expected TableGridDoc JSON with columns[] and rows[]'),
    };
  }
  return { ok: true, doc: docFromGrid(normalizeTableGrid(parsed.value)) };
}

export function serializeText(doc: DocNode, indent: number | string = 2): string {
  return JSON.stringify(gridFromDoc(doc), null, indent);
}

export function serializeDoc(doc: DocNode): string {
  return serializeText(doc);
}
