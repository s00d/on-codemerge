import type { DocNode, JSONDoc, Mark } from './types';

let idCounter = 0;

export function resetIdCounter(n = 0): void {
  idCounter = n;
}

export function nextId(prefix = 'n'): string {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

export function createText(text: string, marks: Mark[] = []): DocNode {
  return { marks: marks.length > 0 ? marks.map((m) => ({ ...m })) : undefined, text, type: 'text' };
}

export function createParagraph(
  content: DocNode[] = [createText('')],
  attrs?: Record<string, unknown>
): DocNode {
  return {
    attrs: copyAttrs(attrs),
    content: [...content],
    id: nextId('p'),
    type: 'paragraph',
  };
}

export function createDoc(content?: DocNode[]): DocNode {
  return {
    content: content !== undefined && content.length > 0 ? [...content] : [createParagraph()],
    id: nextId('doc'),
    type: 'doc',
  };
}

function isAttrsRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Null-prototype attrs bag (no __proto__ pollution). */
export function emptyAttrsRecord(): Record<string, unknown> {
  const raw: unknown = Object.create(null);
  if (!isAttrsRecord(raw)) {
    return {};
  }
  return raw;
}

/** Copy own enumerable attrs onto a null-prototype bag (no __proto__ pollution). */
export function copyAttrs(
  src?: Record<string, unknown> | null
): Record<string, unknown> | undefined {
  if (!src) {
    return undefined;
  }
  const out = emptyAttrsRecord();
  for (const key of Object.keys(src)) {
    out[key] = src[key];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Shallow clone node; children array is new, child refs shared (structural sharing). */
export function cloneNode(node: DocNode): DocNode {
  return {
    ...node,
    attrs: copyAttrs(node.attrs),
    content: node.content ? [...node.content] : undefined,
    marks: node.marks ? node.marks.map((m) => ({ ...m, attrs: copyAttrs(m.attrs) })) : undefined,
    text: node.text,
  };
}

/** Deep clone node tree (content recursively cloned). */
export function deepCloneNode(node: DocNode): DocNode {
  const cloned = cloneNode(node);
  if (cloned.content) {
    cloned.content = cloned.content.map(deepCloneNode);
  }
  return cloned;
}

function deepClone<T>(value: T): T {
  return structuredClone(value);
}

/** Document JSON format version — bump when the on-disk shape changes. */
export const JSON_DOC_VERSION = 1;

export function docToJSON(doc: DocNode): JSONDoc {
  return { doc: deepClone(doc), version: JSON_DOC_VERSION };
}

function isJSONDoc(value: object): value is JSONDoc {
  if (!('version' in value) || !('doc' in value)) {
    return false;
  }
  const doc = Reflect.get(value, 'doc');
  return typeof doc === 'object' && doc !== null;
}

function isDocNode(value: object): value is DocNode {
  return typeof Reflect.get(value, 'type') === 'string';
}

export function docFromJSON(json: JSONDoc | DocNode | object): DocNode {
  if (isJSONDoc(json)) {
    if (json.version !== JSON_DOC_VERSION) {
      throw new Error(`Unsupported JSONDoc version: ${json.version}`);
    }
    if (json.doc.type !== 'doc') {
      throw new Error('Expected root type "doc"');
    }
    assertTreeDepth(json.doc);
    return deepClone(json.doc);
  }
  if (isDocNode(json) && json.type === 'doc') {
    assertTreeDepth(json);
    return deepClone(json);
  }
  throw new Error('Expected root type "doc"');
}

function assertTreeDepth(node: DocNode, max = 64): void {
  const stack: { n: DocNode; d: number }[] = [{ n: node, d: 0 }];
  while (stack.length > 0) {
    const { n, d } = stack.pop()!;
    if (d > max) {
      throw new Error(`Tree exceeds MAX_TREE_DEPTH (${max})`);
    }
    for (const child of n.content ?? []) {
      stack.push({ n: child, d: d + 1 });
    }
  }
}

export function getNodeAt(doc: DocNode, path: number[]): DocNode {
  let cur = doc;
  for (const index of path) {
    if (!cur.content || index < 0 || index >= cur.content.length) {
      throw new Error(`Invalid path: ${path.join('.')}`);
    }
    cur = cur.content[index];
  }
  return cur;
}

export function replaceAt(doc: DocNode, path: number[], next: DocNode): DocNode {
  if (path.length === 0) {
    return next;
  }
  const [head, ...rest] = path,
    cloned = cloneNode(doc);
  if (!cloned.content) {
    throw new Error('Cannot replace in leaf');
  }
  cloned.content[head] = replaceAt(cloned.content[head], rest, next);
  return cloned;
}

export function textLength(node: DocNode): number {
  if (node.type === 'text') {
    return node.text?.length ?? 0;
  }
  if (!node.content) {
    return 0;
  }
  return node.content.reduce((sum, child) => sum + textLength(child), 0);
}
