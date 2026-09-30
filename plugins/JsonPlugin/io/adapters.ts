import type { DocNode } from '@codemerge/kernel';
import { nextId } from '@codemerge/kernel';

const VALUE_TYPES = new Set([
  'jsonObject',
  'jsonArray',
  'jsonString',
  'jsonNumber',
  'jsonBoolean',
  'jsonNull',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const MAX_ENCODE_DEPTH = 512;

function encodeValue(value: unknown, depth = 0, seen?: WeakSet<object>): DocNode {
  if (depth > MAX_ENCODE_DEPTH) {
    throw new TypeError('JSON value exceeds max depth');
  }
  if (value === null) {
    return { type: 'jsonNull', id: nextId('jn') };
  }
  if (typeof value === 'string') {
    return { type: 'jsonString', id: nextId('js'), text: value };
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('json number must be finite');
    }
    return { type: 'jsonNumber', id: nextId('jn'), attrs: { value } };
  }
  if (typeof value === 'boolean') {
    return { type: 'jsonBoolean', id: nextId('jb'), attrs: { value } };
  }
  if (Array.isArray(value)) {
    const bag = seen ?? new WeakSet<object>();
    if (bag.has(value)) {
      throw new TypeError('JSON value contains a cycle');
    }
    bag.add(value);
    try {
      return {
        type: 'jsonArray',
        id: nextId('ja'),
        content: value.map((child) => encodeValue(child, depth + 1, bag)),
      };
    } finally {
      bag.delete(value);
    }
  }
  if (isPlainObject(value)) {
    const bag = seen ?? new WeakSet<object>();
    if (bag.has(value)) {
      throw new TypeError('JSON value contains a cycle');
    }
    bag.add(value);
    try {
      const entries = Object.entries(value);
      return {
        type: 'jsonObject',
        id: nextId('jo'),
        content: entries.map(([key, child]) => ({
          type: 'jsonProperty',
          id: nextId('jp'),
          attrs: { key },
          content: [encodeValue(child, depth + 1, bag)],
        })),
      };
    } finally {
      bag.delete(value);
    }
  }
  throw new TypeError(`Unsupported JSON value type: ${typeof value}`);
}

function decodeValue(node: DocNode): unknown {
  switch (node.type) {
    case 'jsonNull':
      return null;
    case 'jsonString':
      return node.text ?? '';
    case 'jsonNumber': {
      const v = node.attrs?.value;
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw new TypeError('jsonNumber.attrs.value must be a finite number');
      }
      return v;
    }
    case 'jsonBoolean': {
      const v = node.attrs?.value;
      if (typeof v !== 'boolean') {
        throw new TypeError('jsonBoolean.attrs.value must be a boolean');
      }
      return v;
    }
    case 'jsonArray':
      return (node.content ?? []).map(decodeValue);
    case 'jsonObject': {
      // Build on null-proto so `out['__proto__']=` cannot forge [[Prototype]];
      // return via object spread (CreateDataProperty) so hosts get a normal Object.
      const out: Record<string, unknown> = {};
      Object.setPrototypeOf(out, null);
      for (const prop of node.content ?? []) {
        if (prop.type !== 'jsonProperty') {
          throw new TypeError('jsonObject children must be jsonProperty');
        }
        const key = prop.attrs?.key;
        if (typeof key !== 'string') {
          throw new TypeError('jsonProperty.attrs.key must be a string');
        }
        const child = prop.content?.[0];
        if (!child) {
          throw new TypeError('jsonProperty must have exactly one value child');
        }
        out[key] = decodeValue(child);
      }
      return { ...out };
    }
    default:
      throw new TypeError(`Not a JSON value node: ${node.type}`);
  }
}

/** Plain JSON value → logical root `type: 'json'` (default pretty indent). */
export function valueToDoc(value: unknown, indent = 2): DocNode {
  const safeIndent =
    indent === 0
      ? 0
      : typeof indent === 'number' && Number.isFinite(indent) && indent > 0
        ? Math.min(10, Math.floor(indent))
        : 2;
  return {
    type: 'json',
    id: nextId('json'),
    attrs: { indent: safeIndent },
    content: [encodeValue(value)],
  };
}

/** Indent preference stored on `json` root attrs (0 = compact). */
export function indentFromDoc(doc: DocNode): number {
  const root = resolveJsonRoot(doc);
  const indent = root.attrs?.indent;
  if (indent === 0) {
    return 0;
  }
  if (typeof indent === 'number' && Number.isFinite(indent) && indent > 0) {
    return Math.min(10, Math.floor(indent));
  }
  return 2;
}

/**
 * Unwrap kernel `doc` (single `json` child) or bare `json` root → plain value.
 */
export function docToValue(doc: DocNode): unknown {
  const jsonRoot = resolveJsonRoot(doc);
  const value = jsonRoot.content?.[0];
  if (!value) {
    return null;
  }
  if (!VALUE_TYPES.has(value.type)) {
    throw new TypeError(`Expected JSON value under json root, got ${value.type}`);
  }
  return decodeValue(value);
}

/** Kernel SoT root: `doc` → one `json` child (normalize requires `type: 'doc'`). */
export function toEditorDoc(jsonRoot: DocNode): DocNode {
  if (jsonRoot.type !== 'json') {
    throw new TypeError('toEditorDoc expects type "json"');
  }
  return {
    type: 'doc',
    id: nextId('doc'),
    content: [jsonRoot],
  };
}

/** True when SoT is exactly `doc` → single `json` child (JSON Editor invariant). */
export function isJsonEditorDoc(doc: DocNode): boolean {
  return doc.type === 'doc' && (doc.content?.length ?? 0) === 1 && doc.content![0]?.type === 'json';
}

export function emptyEditorDoc(value: unknown = null): DocNode {
  return toEditorDoc(valueToDoc(value));
}

export function resolveJsonRoot(doc: DocNode): DocNode {
  if (doc.type === 'json') {
    return doc;
  }
  if (doc.type === 'doc') {
    const child = doc.content?.[0];
    if (child?.type === 'json') {
      return child;
    }
  }
  throw new TypeError('Expected doc with json root or bare json node');
}

export function encodeJsonValue(value: unknown): DocNode {
  return encodeValue(value);
}
