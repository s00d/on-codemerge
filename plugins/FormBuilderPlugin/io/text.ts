import type { DocNode } from '@codemerge/kernel';
import type { FormConfig } from '../types';
import { isFormConfig } from '../types';
import { configFromDoc, docFromConfig, emptyFormConfig } from './adapters';

export const MAX_FORM_BYTES = 2_000_000;

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
  if (text.length > MAX_FORM_BYTES) {
    return {
      ok: false,
      error: new ParseError(`Form JSON exceeds ${MAX_FORM_BYTES} bytes`),
    };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, doc: docFromConfig(emptyFormConfig()) };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isFormConfig(parsed)) {
      return { ok: false, error: new ParseError('Expected FormConfig JSON with fields[]') };
    }
    return { ok: true, doc: docFromConfig(parsed) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    return { ok: false, error: new ParseError(msg) };
  }
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
