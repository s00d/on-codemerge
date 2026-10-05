import type { DocNode } from '@codemerge/kernel';
import { ParseError, parseJsonPayload } from '@codemerge/kernel';
import type { FormConfig } from '../types';
import { isFormConfig } from '../types';
import { configFromDoc, docFromConfig, emptyFormConfig } from './adapters';

export const MAX_FORM_BYTES = 2_000_000;

export type ParseTextResult = { ok: true; doc: DocNode } | { ok: false; error: ParseError };

export function parseText(text: string): ParseTextResult {
  const parsed = parseJsonPayload(
    text,
    MAX_FORM_BYTES,
    `Form JSON exceeds ${MAX_FORM_BYTES} bytes`
  );
  if (!parsed.ok) {
    return { ok: false, error: new ParseError(parsed.message) };
  }
  if (parsed.empty) {
    return { ok: true, doc: docFromConfig(emptyFormConfig()) };
  }
  if (!isFormConfig(parsed.value)) {
    return { ok: false, error: new ParseError('Expected FormConfig JSON with fields[]') };
  }
  return { ok: true, doc: docFromConfig(parsed.value) };
}

export function serializeText(doc: DocNode, indent: number | string = 2): string {
  return JSON.stringify(configFromDoc(doc), null, indent);
}

export function serializeDoc(doc: DocNode): string {
  return serializeText(doc);
}

export function serializeConfig(config: FormConfig, indent: number | string = 2): string {
  return JSON.stringify(config, null, indent);
}
