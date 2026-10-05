import type { DocNode } from '@codemerge/kernel';
import { ParseError, parseJsonPayload } from '@codemerge/kernel';
import type { ChartAttrs } from './adapters';
import {
  attrsFromDoc,
  docFromAttrs,
  emptyChartAttrs,
  isChartAttrs,
  normalizeChartAttrs,
} from './adapters';

export const MAX_CHART_BYTES = 2_000_000;

export type ParseTextResult = { ok: true; doc: DocNode } | { ok: false; error: ParseError };

export function parseText(text: string): ParseTextResult {
  const parsed = parseJsonPayload(
    text,
    MAX_CHART_BYTES,
    `Chart JSON exceeds ${MAX_CHART_BYTES} bytes`
  );
  if (!parsed.ok) {
    return { ok: false, error: new ParseError(parsed.message) };
  }
  if (parsed.empty) {
    return { ok: true, doc: docFromAttrs(emptyChartAttrs()) };
  }
  const value = parsed.value;
  if (!isChartAttrs(value) && typeof value === 'object' && value !== null) {
    return { ok: true, doc: docFromAttrs(normalizeChartAttrs(value)) };
  }
  if (!isChartAttrs(value)) {
    return { ok: false, error: new ParseError('Expected chart attrs JSON') };
  }
  return { ok: true, doc: docFromAttrs(normalizeChartAttrs(value)) };
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
