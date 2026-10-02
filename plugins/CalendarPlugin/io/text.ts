import type { DocNode } from '@codemerge/kernel';
import type { CalendarDoc } from '../types';
import { isCalendarDoc } from '../types';
import { coerceCalendarDoc, emptyCalendarDoc } from '../drivers/defaults';
import { docFromPayload, payloadFromDoc } from './adapters';

export const MAX_CALENDAR_BYTES = 2_000_000;

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
  if (text.length > MAX_CALENDAR_BYTES) {
    return {
      ok: false,
      error: new ParseError(`Calendar JSON exceeds ${MAX_CALENDAR_BYTES} bytes`),
    };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, doc: docFromPayload(emptyCalendarDoc()) };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    const payload = isCalendarDoc(parsed) ? parsed : coerceCalendarDoc(parsed);
    return { ok: true, doc: docFromPayload(payload) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    return { ok: false, error: new ParseError(msg) };
  }
}

export function serializeText(doc: DocNode, indent: number | string = 2): string {
  return JSON.stringify(payloadFromDoc(doc), null, indent);
}

export function serializeDoc(doc: DocNode): string {
  return serializeText(doc);
}

export function serializePayload(payload: CalendarDoc, indent: number | string = 2): string {
  return JSON.stringify(payload, null, indent);
}
