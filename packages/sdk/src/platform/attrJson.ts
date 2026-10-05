import { asAttr, parseJson } from '@codemerge/view';

/**
 * DocNode.attrs keys that hold structured JSON (object/array) in SoT.
 * HTML boundary stringifies them into data-*; import parses back.
 */
export const JSON_ATTR_KEYS = new Set([
  'data',
  'schema',
  'payload',
  'tree',
  'items',
  'style',
  'actions',
]);

/** Scalar → string; object/array → JSON for HTML data-* attrs. */
export function attrToHtmlValue(v: unknown): string {
  if (v === null || v === undefined) {
    return '';
  }
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return '';
    }
  }
  return asAttr(v);
}

/**
 * Read structured attr: accept typed object/array or legacy JSON string.
 * Fail-closed → fallback when parse/guard fails.
 */
export function readJsonAttr<T>(
  raw: unknown,
  fallback: T,
  guard: (value: unknown) => value is T
): T;
export function readJsonAttr(raw: unknown, fallback: unknown): unknown;
export function readJsonAttr(
  raw: unknown,
  fallback: unknown,
  guard?: (value: unknown) => boolean
): unknown {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return fallback;
    }
    try {
      value = parseJson(trimmed);
    } catch {
      return fallback;
    }
  }
  if (guard) {
    return guard(value) ? value : fallback;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return value;
}

/** Identity for SoT writes — keep object/array, never re-stringify into attrs. */
export function writeJsonAttr<T>(value: T): T {
  return value;
}

/** Try parse a data-* string into object/array when key is a known JSON attr. */
export function coerceHtmlJsonAttr(key: string, value: string): unknown {
  if (!JSON_ATTR_KEYS.has(key)) {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed === '' || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
    return value;
  }
  try {
    return parseJson(trimmed);
  } catch {
    return value;
  }
}
