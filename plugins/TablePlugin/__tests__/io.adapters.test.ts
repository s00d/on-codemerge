import { describe, expect, it } from 'vitest';
import { resetIdCounter } from '@codemerge/kernel';
import {
  emptyTableGrid,
  gridFromMatrix,
  gridToHtml,
  gridToMatrix,
  isTableEditorDoc,
  isTableGridDoc,
  normalizeTableGrid,
  emptyEditorDoc,
  gridFromDoc,
} from '../io/adapters';

describe('TablePlugin io/adapters v2', () => {
  it('emptyTableGrid has version 2 and row objects', () => {
    resetIdCounter();
    const g = emptyTableGrid();
    expect(g.version).toBe(2);
    expect(g.columns).toHaveLength(2);
    expect(g.rows[0]?.id).toBeTruthy();
    expect(typeof g.rows[0]?.cells).toBe('object');
  });

  it('migrates v1 string[][] rows', () => {
    const g = normalizeTableGrid({
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
      rows: [
        ['1', '2'],
        ['3', '4'],
      ],
    });
    expect(g.version).toBe(2);
    expect(g.rows).toHaveLength(2);
    expect(g.rows[0]?.cells.a).toBe('1');
    expect(g.rows[1]?.cells.b).toBe('4');
  });

  it('isTableGridDoc accepts v1 and v2', () => {
    expect(
      isTableGridDoc({
        columns: [{ id: 'a', title: 'A' }],
        rows: [['x']],
      })
    ).toBe(true);
    expect(
      isTableGridDoc({
        columns: [{ id: 'a', title: 'A' }],
        rows: [{ id: 'r1', cells: { a: 'x' } }],
      })
    ).toBe(true);
    expect(isTableGridDoc({ columns: [], rows: 'nope' })).toBe(false);
  });

  it('gridFromMatrix with header', () => {
    const g = gridFromMatrix(
      [
        ['Name', 'Qty'],
        ['Apples', '3'],
      ],
      true
    );
    expect(g.columns.map((c) => c.title)).toStrictEqual(['Name', 'Qty']);
    expect(g.rows).toHaveLength(1);
    expect(Object.values(g.rows[0]!.cells)).toStrictEqual(['Apples', '3']);
  });

  it('emptyEditorDoc / gridFromDoc roundtrip', () => {
    const doc = emptyEditorDoc({
      version: 2,
      columns: [{ id: 'c', title: 'C' }],
      rows: [{ id: 'r', cells: { c: 42 } }],
    });
    expect(isTableEditorDoc(doc)).toBe(true);
    const g = gridFromDoc(doc);
    expect(g.rows[0]?.cells.c).toBe(42);
  });

  it('roundtrips theme and cell styles', () => {
    const doc = emptyEditorDoc({
      version: 2,
      theme: 'striped',
      columns: [{ id: 'c', title: 'C' }],
      rows: [
        {
          id: 'r',
          cells: { c: 'x' },
          styles: {
            c: { align: 'center', background: '#ff0000', color: '#111111', border: 'thick' },
          },
        },
      ],
    });
    const g = gridFromDoc(doc);
    expect(g.theme).toBe('striped');
    expect(g.rows[0]?.styles?.c).toStrictEqual({
      align: 'center',
      background: '#ff0000',
      color: '#111111',
      border: 'thick',
    });
  });

  it('roundtrips source url', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [{ id: 'c', title: 'C' }],
      rows: [{ id: 'r', cells: { c: 'x' } }],
      source: { url: 'https://example.com/data.json', format: 'json', headers: true },
    });
    expect(g.source).toStrictEqual({
      url: 'https://example.com/data.json',
      format: 'json',
      headers: true,
    });
    const round = gridFromDoc(emptyEditorDoc(g));
    expect(round.source?.url).toBe('https://example.com/data.json');
  });

  it('roundtrips view.fit and rowHeight', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [{ id: 'c', title: 'C' }],
      rows: [{ id: 'r', cells: { c: 'x' } }],
      view: { fit: 'content', rowHeight: 40 },
    });
    expect(g.view?.fit).toBe('content');
    expect(g.view?.rowHeight).toBe(40);
  });

  it('gridToMatrix appends columns missing from stale columnOrder', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
        { id: 'c', title: 'C' },
      ],
      rows: [{ id: 'r1', cells: { a: '1', b: '2', c: '3' } }],
      view: { columnOrder: ['b', 'a'] },
    });
    expect(gridToMatrix(g)[0]).toStrictEqual(['B', 'A', 'C']);
    expect(gridToMatrix(g)[1]).toStrictEqual(['2', '1', '3']);
  });

  it('gridToHtml emits used cells and escapes markup', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [
        { id: 'a', title: 'A <x>' },
        { id: 'b', title: 'B' },
      ],
      rows: [
        {
          id: 'r1',
          cells: { a: '<script>', b: 2 },
          styles: { b: { background: '#fee2e2', align: 'right' } },
        },
      ],
    });
    const html = gridToHtml(g);
    expect(html).toContain('html-editor-table--sheet');
    expect(html).toContain('html-editor-table--fill');
    expect(html).toContain('style="width:100%"');
    expect(html).toContain('<col style="width:128px">');
    expect(html).toContain('<th>A &lt;x&gt;</th>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('background:#fee2e2');
    expect(html).toContain('text-align:right');
    expect(html).not.toContain('<script>');
  });

  it('gridToHtml keeps stored column widths when fit is content', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [
        { id: 'name', title: 'Name', width: 160 },
        { id: 'qty', title: 'Qty', width: 96 },
      ],
      rows: [{ id: 'r1', cells: { name: 'Apples', qty: 3 } }],
      view: { fit: 'content' },
    });
    const html = gridToHtml(g);
    expect(html).toContain('html-editor-table--content');
    expect(html).toContain('style="width:256px"');
    expect(html).toContain('<col style="width:160px">');
    expect(html).toContain('<col style="width:96px">');
  });

  it('gridToHtml stretches to host when fit is fill', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [
        { id: 'name', title: 'Name', width: 160 },
        { id: 'qty', title: 'Qty', width: 96 },
      ],
      rows: [{ id: 'r1', cells: { name: 'Apples', qty: 3 } }],
    });
    const html = gridToHtml(g);
    expect(html).toContain('html-editor-table--fill');
    expect(html).toContain('style="width:100%"');
    expect(html).toContain('<col style="width:160px">');
    expect(html).toContain('<col style="width:96px">');
  });

  it('strips self/cyclic parentId edges', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'r1', cells: { a: '1' }, parentId: 'r2' },
        { id: 'r2', cells: { a: '2' }, parentId: 'r1' },
        { id: 'r3', cells: { a: '3' }, parentId: 'r3' },
      ],
    });
    expect(g.rows.find((r) => r.id === 'r1')?.parentId).toBeNull();
    expect(g.rows.find((r) => r.id === 'r2')?.parentId).toBeNull();
    expect(g.rows.find((r) => r.id === 'r3')?.parentId).toBeNull();
  });
});
