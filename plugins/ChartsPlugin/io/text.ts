import type { DocNode } from '@codemerge/kernel';
import type { ChartAttrs } from './adapters';
import {
  attrsFromDoc,
  docFromAttrs,
  emptyChartAttrs,
  isChartAttrs,
  normalizeChartAttrs,
} from './adapters';

export const MAX_CHART_BYTES = 2_000_000;

export class ParseError extends Error {
  readonly offset?: number;

  constructor(message: string, offset?: number) {
    super(message);
    this.name = 'ParseError';
    this.offset = offset;
  }
}

export type ParseTextResult = { ok: true; doc: DocNode } | { ok: false; error: ParseError };

export function parseText(text: string): ParseTextResult {
  if (text.length > MAX_CHART_BYTES) {
    return {
      ok: false,
      error: new ParseError(`Chart JSON exceeds ${MAX_CHART_BYTES} bytes`),
    };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, doc: docFromAttrs(emptyChartAttrs()) };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isChartAttrs(parsed) && typeof parsed === 'object' && parsed !== null) {
      // allow partial JSON
      return { ok: true, doc: docFromAttrs(normalizeChartAttrs(parsed)) };
    }
    if (!isChartAttrs(parsed)) {
      return { ok: false, error: new ParseError('Expected chart attrs JSON') };
    }
    return { ok: true, doc: docFromAttrs(normalizeChartAttrs(parsed)) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    return { ok: false, error: new ParseError(msg) };
  }
}

export function serializeText(doc: DocNode, indent: number | string = 2): string {
  return JSON.stringify(attrsFromDoc(doc), null, indent);
}

export function serializeDoc(doc: DocNode): string {
  return serializeText(doc);
}

export function serializeAttrs(attrs: ChartAttrs, indent: number | string = 2): string {
  return JSON.stringify(attrs, null, indent);
}
