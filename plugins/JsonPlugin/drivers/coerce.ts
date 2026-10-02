import type { JsonLeafType } from '../commands/types';
import { isPlainObject } from './types';

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export function coerceToString(from: unknown): string {
  if (typeof from === 'string') {
    return from;
  }
  if (from === null || from === undefined) {
    return '';
  }
  if (typeof from === 'number' || typeof from === 'boolean') {
    return String(from);
  }
  try {
    return JSON.stringify(from);
  } catch {
    return '';
  }
}

export function coerceToNumber(from: unknown): number {
  if (typeof from === 'number' && Number.isFinite(from)) {
    return from;
  }
  if (typeof from === 'boolean') {
    return from ? 1 : 0;
  }
  if (typeof from === 'string') {
    const trimmed = from.trim();
    if (!trimmed) {
      return 0;
    }
    const n = Number(trimmed);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return 0;
}

export function coerceToBoolean(from: unknown): boolean {
  if (typeof from === 'boolean') {
    return from;
  }
  if (typeof from === 'number' && Number.isFinite(from)) {
    return from !== 0;
  }
  if (typeof from === 'string') {
    const t = from.trim().toLowerCase();
    if (t === 'true' || t === '1' || t === 'yes') {
      return true;
    }
    if (t === 'false' || t === '0' || t === 'no' || t === '') {
      return false;
    }
  }
  if (from === null || from === undefined) {
    return false;
  }
  return Boolean(from);
}

export function coerceToNull(_from: unknown): null {
  return null;
}

export function coerceToArray(from: unknown): unknown[] {
  if (Array.isArray(from)) {
    return from;
  }
  if (typeof from === 'string') {
    const parsed = tryParseJson(from);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  }
  if (isPlainObject(from)) {
    return Object.values(from);
  }
  if (from === null || from === undefined) {
    return [];
  }
  return [from];
}

export function coerceToObject(from: unknown): Record<string, unknown> {
  if (isPlainObject(from)) {
    return { ...from };
  }
  if (typeof from === 'string') {
    const parsed = tryParseJson(from);
    if (isPlainObject(parsed)) {
      return { ...parsed };
    }
  }
  if (Array.isArray(from)) {
    const out: Record<string, unknown> = {};
    from.forEach((v, i) => {
      out[String(i)] = v;
    });
    return out;
  }
  return {};
}

export function coerceForType(type: JsonLeafType, from: unknown): unknown {
  switch (type) {
    case 'jsonString':
      return coerceToString(from);
    case 'jsonNumber':
      return coerceToNumber(from);
    case 'jsonBoolean':
      return coerceToBoolean(from);
    case 'jsonNull':
      return coerceToNull(from);
    case 'jsonArray':
      return coerceToArray(from);
    case 'jsonObject':
      return coerceToObject(from);
    default: {
      const _exhaustive: never = type;
      void _exhaustive;
      return null;
    }
  }
}
