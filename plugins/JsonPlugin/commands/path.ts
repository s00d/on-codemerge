import type { DocNode } from '@codemerge/kernel';
import { getNodeAt } from '@codemerge/kernel';
import { VALUE_TYPES } from './types';

/** Decode a JSON value / property node to a plain JS value. */
export function valueFromNode(node: DocNode): unknown {
  if (node.type === 'jsonProperty') {
    const child = node.content?.[0];
    if (!child) {
      return null;
    }
    return valueFromNode(child);
  }
  switch (node.type) {
    case 'jsonNull':
      return null;
    case 'jsonString':
      return node.text ?? '';
    case 'jsonNumber': {
      const v = node.attrs?.value;
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        return 0;
      }
      return v;
    }
    case 'jsonBoolean':
      return node.attrs?.value === true;
    case 'jsonArray':
      return (node.content ?? []).map(valueFromNode);
    case 'jsonObject': {
      const out: Record<string, unknown> = {};
      for (const prop of node.content ?? []) {
        if (prop.type !== 'jsonProperty') {
          continue;
        }
        const key = prop.attrs?.key;
        if (typeof key !== 'string') {
          continue;
        }
        out[key] = valueFromNode(prop);
      }
      return out;
    }
    default:
      throw new TypeError(`Not a JSON value node: ${node.type}`);
  }
}

/**
 * Human path segments for breadcrumbs (`users`, `0`, `email`).
 * `path` may point at property, value, or container.
 */
export function pathSegments(doc: DocNode, path: number[]): string[] {
  const segments: string[] = [];
  let cur = doc;
  for (const idx of path) {
    const kids = cur.content ?? [];
    const child = kids[idx];
    if (child === undefined) {
      break;
    }
    if (child.type === 'jsonProperty') {
      const key = typeof child.attrs?.key === 'string' ? child.attrs.key : String(idx);
      segments.push(key);
    } else if (cur.type === 'jsonArray') {
      segments.push(String(idx));
    } else if (child.type === 'json' || child.type === 'jsonObject' || child.type === 'jsonArray') {
      // skip wrapper labels
    }
    cur = child;
  }
  return segments;
}

/** Dot path like `users.0.email` (empty → `$`). */
export function pathToDot(doc: DocNode, path: number[]): string {
  const segs = pathSegments(doc, path);
  return segs.length === 0 ? '$' : segs.join('.');
}

/** JSON Pointer like `/users/0/email` (empty → ``). */
export function pathToJsonPointer(doc: DocNode, path: number[]): string {
  const segs = pathSegments(doc, path);
  if (segs.length === 0) {
    return '';
  }
  return `/${segs.map((s) => s.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;
}

/** Plain value at path (property resolves to its value child). */
export function valueAtDocPath(doc: DocNode, path: number[]): unknown {
  try {
    const node = getNodeAt(doc, path);
    if (node.type === 'jsonProperty') {
      return valueFromNode(node);
    }
    if (node.type === 'json') {
      const child = node.content?.[0];
      return child ? valueFromNode(child) : null;
    }
    if (VALUE_TYPES.has(node.type)) {
      return valueFromNode(node);
    }
    return null;
  } catch {
    return undefined;
  }
}
