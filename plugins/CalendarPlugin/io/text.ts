import type { DocNode } from '@codemerge/kernel';
import { ParseError, parseJsonPayload } from '@ocm/wysiwyg/utils/parseSoT';
import type { CalendarDoc } from '../types';
import { isCalendarDoc } from '../types';
import { coerceCalendarDoc, emptyCalendarDoc } from '../drivers/defaults';
import { docFromPayload, payloadFromDoc } from './adapters';

export const MAX_CALENDAR_BYTES = 2_000_000;

export type ParseTextResult = { ok: true; doc: DocNode } | { ok: false; error: ParseError };

export function parseText(text: string): ParseTextResult {
  const parsed = parseJsonPayload(
    text,
    MAX_CALENDAR_BYTES,
    `Calendar JSON exceeds ${MAX_CALENDAR_BYTES} bytes`
  );
  if (!parsed.ok) {
    return { ok: false, error: new ParseError(parsed.message) };
  }
  if (parsed.empty) {
    return { ok: true, doc: docFromPayload(emptyCalendarDoc()) };
  }
  const payload = isCalendarDoc(parsed.value) ? parsed.value : coerceCalendarDoc(parsed.value);
  return { ok: true, doc: docFromPayload(payload) };
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
