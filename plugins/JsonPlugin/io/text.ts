import type { DocNode } from '@on-codemerge/kernel';
import { docToValue, indentFromDoc, toEditorDoc, valueToDoc } from './adapters';

export class ParseError extends Error {
  readonly name = 'ParseError';
  readonly offset: number | undefined;

  constructor(message: string, offset?: number) {
    super(message);
    this.offset = offset;
  }
}

export type ParseTextResult =
  | { ok: true; doc: DocNode; value: unknown }
  | { ok: false; error: ParseError };

const MAX_JSON_BYTES = 1_000_000;
const MAX_PARSE_DEPTH = 64;
const MAX_NODES = 100_000;

/** Nesting depth of `{}` / `[]` outside JSON strings (preflight before JSON.parse). */
function nestingDepth(text: string): number {
  let depth = 0;
  let max = 0;
  let inString = false;
  let escape = false;
  for (const ch of text) {
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') {
      depth += 1;
      if (depth > max) {
        max = depth;
      }
    } else if (ch === '}' || ch === ']') {
      depth -= 1;
    }
  }
  return max;
}

function countNodes(value: unknown): number {
  let count = 0;
  const stack: unknown[] = [value];
  while (stack.length > 0) {
    const cur = stack.pop();
    count += 1;
    if (count > MAX_NODES) {
      return count;
    }
    if (Array.isArray(cur)) {
      for (const child of cur) {
        stack.push(child);
      }
    } else if (isPlainRecord(cur)) {
      for (const child of Object.values(cur)) {
        stack.push(child);
      }
    }
  }
  return count;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** JSON.parse → adapters; failure → ParseError (SoT untouched by caller). */
export function parseText(text: string, indent = 2): ParseTextResult {
  if (text.length > MAX_JSON_BYTES) {
    return { ok: false, error: new ParseError('JSON too large') };
  }
  if (nestingDepth(text) > MAX_PARSE_DEPTH) {
    return { ok: false, error: new ParseError('JSON too deeply nested') };
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    const match = /position\s+(\d+)/i.exec(message);
    const offset = match ? Number(match[1]) : undefined;
    return { ok: false, error: new ParseError(message, offset) };
  }
  if (countNodes(value) > MAX_NODES) {
    return { ok: false, error: new ParseError('JSON too many nodes') };
  }
  try {
    const jsonRoot = valueToDoc(value, indent);
    return { ok: true, doc: toEditorDoc(jsonRoot), value };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON value';
    return { ok: false, error: new ParseError(message) };
  }
}

export function serializeText(value: unknown, indent: number | string = 2): string {
  return `${JSON.stringify(value, null, indent)}\n`;
}

/** Plain JSON from editor/kernel doc (indent from `json` attrs unless overridden). */
export function serializeDoc(doc: DocNode, indent?: number | string): string {
  return serializeText(docToValue(doc), indent === undefined ? indentFromDoc(doc) : indent);
}
