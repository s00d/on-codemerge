import type { Command, DocNode, EditorState, Operation } from '@codemerge/kernel';
import { getNodeAt } from '@codemerge/kernel';
import { encodeJsonValue } from '../io/adapters';
import { defaultValueForType, getDriver, isJsonLeafType } from '../drivers/registry';
import { valueFromNode } from './path';
import type { JsonLeafType } from './types';
import { VALUE_TYPES } from './types';

function replaceAtPath(path: number[], node: DocNode): Operation[] {
  if (path.length === 0) {
    throw new Error('Cannot replace document root via replaceAtPath');
  }
  const parentPath = path.slice(0, -1);
  const index = path.at(-1);
  if (index === undefined) {
    throw new Error('replaceAtPath: empty index');
  }
  return [
    { type: 'remove_node', path: parentPath, index },
    { type: 'insert_node', path: parentPath, index, node },
  ];
}

function objectKeys(objectNode: DocNode): Set<string> {
  const keys = new Set<string>();
  for (const prop of objectNode.content ?? []) {
    if (prop.type !== 'jsonProperty') {
      continue;
    }
    const key = prop.attrs?.key;
    if (typeof key === 'string') {
      keys.add(key);
    }
  }
  return keys;
}

function isValuePath(state: EditorState, path: number[]): boolean {
  try {
    return VALUE_TYPES.has(getNodeAt(state.doc, path).type);
  } catch {
    return false;
  }
}

/** Replace JSON value node at `path`. */
export function setValue(path: number[], value: unknown): Command {
  return (state) => {
    if (!isValuePath(state, path)) {
      return null;
    }
    return replaceAtPath(path, encodeJsonValue(value));
  };
}

/**
 * Insert `jsonProperty` under object. Rejects duplicate keys (returns null).
 */
export function insertProperty(objectPath: number[], key: string, value: unknown = null): Command {
  return (state) => {
    let objectNode: DocNode;
    try {
      objectNode = getNodeAt(state.doc, objectPath);
    } catch {
      return null;
    }
    if (objectNode.type !== 'jsonObject') {
      return null;
    }
    if (objectKeys(objectNode).has(key)) {
      return null;
    }
    const prop: DocNode = {
      type: 'jsonProperty',
      attrs: { key },
      content: [encodeJsonValue(value)],
    };
    return [
      {
        type: 'insert_node',
        path: objectPath,
        index: objectNode.content?.length ?? 0,
        node: prop,
      },
    ];
  };
}

/** Append (or insert at index) a value into `jsonArray`. */
export function insertItem(arrayPath: number[], value: unknown = null, index?: number): Command {
  return (state) => {
    let arrayNode: DocNode;
    try {
      arrayNode = getNodeAt(state.doc, arrayPath);
    } catch {
      return null;
    }
    if (arrayNode.type !== 'jsonArray') {
      return null;
    }
    const len = arrayNode.content?.length ?? 0;
    const at = index === undefined ? len : Math.max(0, Math.min(index, len));
    return [
      {
        type: 'insert_node',
        path: arrayPath,
        index: at,
        node: encodeJsonValue(value),
      },
    ];
  };
}

/** Remove node at path (property, array item, or value under json root — not json/doc). */
export function deleteNode(path: number[]): Command {
  return (state) => {
    if (path.length === 0) {
      return null;
    }
    const parentPath = path.slice(0, -1);
    const index = path.at(-1);
    if (index === undefined) {
      return null;
    }
    let parent: DocNode;
    let node: DocNode;
    try {
      parent = getNodeAt(state.doc, parentPath);
      node = getNodeAt(state.doc, path);
    } catch {
      return null;
    }
    // Keep single-child invariant on json / jsonProperty — replace with null.
    if (parent.type === 'json' || parent.type === 'jsonProperty') {
      return replaceAtPath(path, encodeJsonValue(null));
    }
    if (parent.type === 'jsonObject' && node.type !== 'jsonProperty') {
      return null;
    }
    if (parent.type !== 'jsonObject' && parent.type !== 'jsonArray') {
      return null;
    }
    return [{ type: 'remove_node', path: parentPath, index }];
  };
}

/** Rename `jsonProperty` key. Rejects duplicates (returns null). */
export function renameKey(propertyPath: number[], newKey: string): Command {
  return (state) => {
    let prop: DocNode;
    try {
      prop = getNodeAt(state.doc, propertyPath);
    } catch {
      return null;
    }
    if (prop.type !== 'jsonProperty') {
      return null;
    }
    const current = prop.attrs?.key;
    if (typeof current === 'string' && current === newKey) {
      // No-op: null (not []) so Editor.run does not dispatch / emit docChanged.
      return null;
    }
    const objectPath = propertyPath.slice(0, -1);
    let objectNode: DocNode;
    try {
      objectNode = getNodeAt(state.doc, objectPath);
    } catch {
      return null;
    }
    if (objectNode.type !== 'jsonObject') {
      return null;
    }
    if (objectKeys(objectNode).has(newKey)) {
      return null;
    }
    return [
      {
        type: 'set_attrs',
        path: propertyPath,
        attrs: { key: newKey },
        replace: false,
      },
    ];
  };
}

/** Change value node type via driver.coerce (best-effort preserve). */
export function changeType(path: number[], newType: JsonLeafType): Command {
  return (state) => {
    if (!isValuePath(state, path)) {
      return null;
    }
    const node = getNodeAt(state.doc, path);
    if (node.type === newType) {
      return [];
    }
    if (!isJsonLeafType(node.type)) {
      return replaceAtPath(path, encodeJsonValue(defaultValueForType(newType)));
    }
    let from: unknown;
    try {
      from = valueFromNode(node);
    } catch {
      from = defaultValueForType(node.type);
    }
    const coerced = getDriver(newType).coerce(from);
    return replaceAtPath(path, encodeJsonValue(coerced));
  };
}

/** Move array item from → to (to is index before removal adjustment). */
export function moveItem(arrayPath: number[], from: number, to: number): Command {
  return (state) => {
    let arrayNode: DocNode;
    try {
      arrayNode = getNodeAt(state.doc, arrayPath);
    } catch {
      return null;
    }
    if (arrayNode.type !== 'jsonArray') {
      return null;
    }
    const content = arrayNode.content ?? [];
    if (from < 0 || from >= content.length || to < 0 || to >= content.length || from === to) {
      return null;
    }
    const node = content[from];
    return [
      { type: 'remove_node', path: arrayPath, index: from },
      {
        type: 'insert_node',
        path: arrayPath,
        index: Math.max(0, Math.min(to, content.length - 1)),
        node,
      },
    ];
  };
}

/**
 * Duplicate property (object) or item (array) after the node at `path`.
 * Value under json/jsonProperty cannot be duplicated — use parent property/item.
 */
export function duplicateNode(path: number[]): Command {
  return (state) => {
    if (path.length < 2) {
      return null;
    }
    const parentPath = path.slice(0, -1);
    const index = path.at(-1);
    if (index === undefined) {
      return null;
    }
    let parent: DocNode;
    let node: DocNode;
    try {
      parent = getNodeAt(state.doc, parentPath);
      node = getNodeAt(state.doc, path);
    } catch {
      return null;
    }
    if (parent.type === 'jsonArray') {
      let value: unknown;
      try {
        value = valueFromNode(node);
      } catch {
        return null;
      }
      return [
        {
          type: 'insert_node',
          path: parentPath,
          index: index + 1,
          node: encodeJsonValue(value),
        },
      ];
    }
    if (parent.type === 'jsonObject' && node.type === 'jsonProperty') {
      const key = typeof node.attrs?.key === 'string' ? node.attrs.key : 'property';
      const keys = objectKeys(parent);
      let nextKey = `${key}_copy`;
      let n = 1;
      while (keys.has(nextKey)) {
        n += 1;
        nextKey = `${key}_copy${n}`;
      }
      let value: unknown = null;
      try {
        const child = node.content?.[0];
        if (child) {
          value = valueFromNode(child);
        }
      } catch {
        return null;
      }
      const prop: DocNode = {
        type: 'jsonProperty',
        attrs: { key: nextKey },
        content: [encodeJsonValue(value)],
      };
      return [
        {
          type: 'insert_node',
          path: parentPath,
          index: index + 1,
          node: prop,
        },
      ];
    }
    return null;
  };
}

export { isValuePath };
