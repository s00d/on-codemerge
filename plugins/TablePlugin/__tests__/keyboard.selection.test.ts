import { describe, expect, it } from 'vitest';
import { TableStore } from '../grid/TableStore';
import { handleGridKeydown, moveActiveDown } from '../grid/keyboard';
import { toggleRowSelection } from '../grid/selection';
import { visibleWindow } from '../grid/viewport';
import { selectionToTsv, pasteTsv } from '../grid/clipboard';

function store3x2(): TableStore {
  return new TableStore({
    version: 2,
    columns: [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ],
    rows: [
      { id: 'r1', cells: { a: '1', b: '2' } },
      { id: 'r2', cells: { a: '3', b: '4' } },
      { id: 'r3', cells: { a: '5', b: '6' } },
    ],
  });
}

function key(name: string, mods: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: name,
    preventDefault: () => undefined,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    ...mods,
  } as KeyboardEvent;
}

describe('keyboard navigation', () => {
  it('ArrowRight/Left/Down/Up move active cell', () => {
    const store = store3x2();
    store.setActive('r1', 'a');
    expect(handleGridKeydown(store, key('ArrowRight')).handled).toBe(true);
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r1', colId: 'b' });
    expect(handleGridKeydown(store, key('ArrowDown')).handled).toBe(true);
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r2', colId: 'b' });
    expect(handleGridKeydown(store, key('ArrowLeft')).handled).toBe(true);
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r2', colId: 'a' });
    expect(handleGridKeydown(store, key('ArrowUp')).handled).toBe(true);
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r1', colId: 'a' });
    store.destroy();
  });

  it('Tab moves across columns then wraps to next row', () => {
    const store = store3x2();
    store.setActive('r1', 'b');
    expect(handleGridKeydown(store, key('Tab')).handled).toBe(true);
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r2', colId: 'a' });
    store.destroy();
  });

  it('Enter moves down via moveActiveDown', () => {
    const store = store3x2();
    store.setActive('r1', 'a');
    moveActiveDown(store);
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r2', colId: 'a' });
    store.destroy();
  });

  it('ignores ArrowLeft/Right while editing', () => {
    const store = store3x2();
    store.setActive('r1', 'a');
    store.setEditing(true);
    expect(handleGridKeydown(store, key('ArrowLeft')).handled).toBe(false);
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r1', colId: 'a' });
    store.destroy();
  });
});

describe('selection + clipboard', () => {
  it('toggleRowSelection additive and range', () => {
    const orderedIds = ['r1', 'r2', 'r3'];
    let sel = { rowIds: ['r1'] as string[], active: { rowId: 'r1', colId: 'a' } };
    sel = toggleRowSelection(sel, 'r3', { additive: true });
    expect(sel.rowIds).toContain('r1');
    expect(sel.rowIds).toContain('r3');
    sel = toggleRowSelection(sel, 'r1', { rangeTo: 'r3', orderedIds });
    expect(sel.rowIds).toStrictEqual(['r1', 'r2', 'r3']);
  });

  it('selectionToTsv covers multi-row selection', () => {
    const store = store3x2();
    store.setSelection({
      rowIds: ['r1', 'r3'],
      active: { rowId: 'r1', colId: 'a' },
    });
    expect(selectionToTsv(store)).toBe('1\t2\n5\t6');
    store.destroy();
  });

  it('pasteTsv overwrites rectangular region', () => {
    const store = store3x2();
    store.setSelection({ rowIds: ['r2'], active: { rowId: 'r2', colId: 'a' } });
    pasteTsv(store, 'X\tY\nP\tQ');
    expect(store.getDoc().rows[1]?.cells).toStrictEqual({ a: 'X', b: 'Y' });
    expect(store.getDoc().rows[2]?.cells).toStrictEqual({ a: 'P', b: 'Q' });
    store.destroy();
  });
});

describe('viewport', () => {
  it('visibleWindow clamps and overscans', () => {
    const w = visibleWindow(100, 200, 1000, 20, 2);
    expect(w.start).toBeGreaterThanOrEqual(0);
    expect(w.end).toBeLessThanOrEqual(50);
    expect(w.end - w.start).toBeGreaterThan(10);
  });
});
