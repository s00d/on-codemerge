import type { Command, DocNode, EditorState } from '@on-codemerge/kernel';
import { getNodeAt } from '@on-codemerge/kernel';
import {
  changeType,
  deleteNode,
  duplicateNode,
  insertItem,
  insertProperty,
  isValuePath,
  moveItem,
  renameKey,
  setValue,
} from './mutate';
import type { JsonLeafType } from './types';

function samePath(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Resolve selection to nearest value / property / container path. */
export function selectionPath(state: EditorState): number[] {
  return state.selection.anchor.path;
}

function findAncestor(
  state: EditorState,
  path: number[],
  type: string
): { path: number[]; node: DocNode } | null {
  for (let len = path.length; len >= 0; len--) {
    const p = path.slice(0, len);
    try {
      const node = getNodeAt(state.doc, p);
      if (node.type === type) {
        return { path: p, node };
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** Named-command adapters: operate relative to selection. */
export function jsonSetValueCommand(value: unknown = null): Command {
  return (state) => {
    const path = selectionPath(state);
    if (isValuePath(state, path)) {
      return setValue(path, value)(state);
    }
    const prop = findAncestor(state, path, 'jsonProperty');
    if (prop) {
      return setValue([...prop.path, 0], value)(state);
    }
    return null;
  };
}

export function insertPropertyCommand(key = 'property', value: unknown = null): Command {
  return (state) => {
    const path = selectionPath(state);
    const object = findAncestor(state, path, 'jsonObject');
    if (!object) {
      return null;
    }
    return insertProperty(object.path, key, value)(state);
  };
}

export function insertItemCommand(value: unknown = null): Command {
  return (state) => {
    const path = selectionPath(state);
    const array = findAncestor(state, path, 'jsonArray');
    if (!array) {
      return null;
    }
    return insertItem(array.path, value)(state);
  };
}

export function deleteNodeCommand(): Command {
  return (state) => {
    const path = selectionPath(state);
    if (path.length === 0 || samePath(path, [0])) {
      return null;
    }
    // Match tree Delete: remove property / array item, not null a value under jsonProperty.
    const prop = findAncestor(state, path, 'jsonProperty');
    if (prop) {
      return deleteNode(prop.path)(state);
    }
    try {
      const parent = getNodeAt(state.doc, path.slice(0, -1));
      if (parent.type === 'jsonArray') {
        return deleteNode(path)(state);
      }
    } catch {
      return null;
    }
    return deleteNode(path)(state);
  };
}

export function renameKeyCommand(newKey: string): Command {
  return (state) => {
    const path = selectionPath(state);
    const prop = findAncestor(state, path, 'jsonProperty');
    if (!prop) {
      return null;
    }
    return renameKey(prop.path, newKey)(state);
  };
}

export function changeTypeCommand(newType: JsonLeafType = 'jsonNull'): Command {
  return (state) => {
    const path = selectionPath(state);
    if (isValuePath(state, path)) {
      return changeType(path, newType)(state);
    }
    const prop = findAncestor(state, path, 'jsonProperty');
    if (prop) {
      return changeType([...prop.path, 0], newType)(state);
    }
    return null;
  };
}

export function moveItemCommand(delta: 1 | -1): Command {
  return (state) => {
    const path = selectionPath(state);
    const array = findAncestor(state, path, 'jsonArray');
    if (!array || path.length !== array.path.length + 1) {
      return null;
    }
    const from = path.at(-1);
    if (from === undefined) {
      return null;
    }
    const to = from + delta;
    return moveItem(array.path, from, to)(state);
  };
}

export function duplicateNodeCommand(): Command {
  return (state) => {
    const path = selectionPath(state);
    const direct = duplicateNode(path)(state);
    if (direct) {
      return direct;
    }
    const prop = findAncestor(state, path, 'jsonProperty');
    if (prop) {
      return duplicateNode(prop.path)(state);
    }
    return null;
  };
}

/** Command map registered on JsonPlugin. */
export function jsonCommandMap(): Record<string, Command> {
  return {
    'json.setValue': jsonSetValueCommand(null),
    insertProperty: insertPropertyCommand('property', null),
    insertItem: insertItemCommand(null),
    deleteNode: deleteNodeCommand(),
    renameKey: renameKeyCommand('property'),
    changeType: changeTypeCommand('jsonNull'),
    moveItem: moveItemCommand(1),
    duplicateNode: duplicateNodeCommand(),
  };
}
