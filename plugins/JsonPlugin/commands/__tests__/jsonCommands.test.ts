import { describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createState,
  getNodeAt,
  runCommand,
  transaction,
} from '@on-codemerge/kernel';
import { emptyEditorDoc, valueToDoc, toEditorDoc, docToValue } from '../../io';
import {
  insertProperty,
  jsonCommandMap,
  renameKey,
  setValue,
  insertItem,
  deleteNode,
  deleteNodeCommand,
  changeType,
  moveItem,
} from '../jsonCommands';

function stateFrom(value: unknown) {
  return createState(toEditorDoc(valueToDoc(value)));
}

describe('json structural commands', () => {
  it('registers required command names', () => {
    const map = jsonCommandMap();
    for (const name of [
      'json.setValue',
      'insertProperty',
      'insertItem',
      'deleteNode',
      'renameKey',
      'changeType',
      'moveItem',
      'duplicateNode',
    ]) {
      expect(map[name]).toBeTypeOf('function');
    }
  });

  it('insertProperty rejects duplicate keys', () => {
    const state = stateFrom({ a: 1 });
    const objectPath = [0, 0];
    expect(runCommand(state, insertProperty(objectPath, 'a', 2))).toBeNull();
    const tr = runCommand(state, insertProperty(objectPath, 'b', 2));
    expect(tr).not.toBeNull();
    const next = applyTransaction(state, tr!).state;
    expect(docToValue(next.doc)).toStrictEqual({ a: 1, b: 2 });
  });

  it('renameKey rejects duplicate keys', () => {
    const state = stateFrom({ a: 1, b: 2 });
    const propA = [0, 0, 0];
    expect(getNodeAt(state.doc, propA).attrs?.key).toBe('a');
    expect(runCommand(state, renameKey(propA, 'b'))).toBeNull();
    expect(runCommand(state, renameKey(propA, 'a'))).toBeNull();
    const tr = runCommand(state, renameKey(propA, 'c'));
    expect(tr).not.toBeNull();
    const next = applyTransaction(state, tr!).state;
    expect(docToValue(next.doc)).toStrictEqual({ c: 1, b: 2 });
  });

  it('changeType same-type is a no-op (preserves value)', () => {
    const state = stateFrom('hello');
    const path = [0, 0];
    const tr = runCommand(state, changeType(path, 'jsonString'));
    expect(tr).not.toBeNull();
    expect(tr!.ops).toStrictEqual([]);
    expect(docToValue(state.doc)).toBe('hello');
  });

  it('setValue / insertItem / deleteNode / changeType / moveItem', () => {
    let state = stateFrom({ arr: [1, 2] });
    const arrPath = [0, 0, 0, 0];
    expect(getNodeAt(state.doc, arrPath).type).toBe('jsonArray');

    state = applyTransaction(state, runCommand(state, insertItem(arrPath, 3))!).state;
    expect(docToValue(state.doc)).toStrictEqual({ arr: [1, 2, 3] });

    state = applyTransaction(state, runCommand(state, moveItem(arrPath, 2, 0))!).state;
    expect(docToValue(state.doc)).toStrictEqual({ arr: [3, 1, 2] });

    state = applyTransaction(state, runCommand(state, setValue([...arrPath, 0], 9))!).state;
    expect(docToValue(state.doc)).toStrictEqual({ arr: [9, 1, 2] });

    state = applyTransaction(
      state,
      runCommand(state, changeType([...arrPath, 1], 'jsonBoolean'))!
    ).state;
    expect(docToValue(state.doc)).toStrictEqual({ arr: [9, false, 2] });

    state = applyTransaction(state, runCommand(state, deleteNode([...arrPath, 2]))!).state;
    expect(docToValue(state.doc)).toStrictEqual({ arr: [9, false] });
  });

  it('deleteNodeCommand removes property from value-path selection', () => {
    let state = stateFrom({ a: 'hello', b: 1 });
    // Select value under property `a` (not the property node).
    state = applyTransaction(
      state,
      transaction({
        type: 'set_selection',
        selection: {
          anchor: { path: [0, 0, 0, 0], offset: 0 },
          focus: { path: [0, 0, 0, 0], offset: 0 },
        },
      })
    ).state;
    const tr = runCommand(state, deleteNodeCommand());
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    expect(docToValue(state.doc)).toStrictEqual({ b: 1 });
  });

  it('empty editor doc is loadable', () => {
    const state = createState(emptyEditorDoc(null));
    expect(docToValue(state.doc)).toBeNull();
    const tr = transaction({
      type: 'set_selection',
      selection: state.selection,
    });
    expect(applyTransaction(state, tr).state.doc.type).toBe('doc');
  });
});
