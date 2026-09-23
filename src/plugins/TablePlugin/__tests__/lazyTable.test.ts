import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  createDoc,
  createParagraph,
  createState,
  createText,
  applyTransaction,
  transaction,
} from '@on-codemerge/kernel';
import {
  fillTableFromMatrix,
  insertLazyTableShell,
  parseCsv,
  parseJsonToMatrix,
  readLazyConfigFromTable,
} from '../lazyTable';
import { findTablePath } from '../tableOps';

describe('lazyTable parsers', () => {
  it('parses CSV with quotes and delimiter', () => {
    expect.hasAssertions();
    expect(parseCsv('a,b\n"c,d",e', ',')).toStrictEqual([
      ['a', 'b'],
      ['c,d', 'e'],
    ]);
  });

  it('parses JSON array-of-objects into header + rows', () => {
    expect.hasAssertions();
    const { matrix, hasHeader } = parseJsonToMatrix([
      { name: 'Ada', age: 36 },
      { name: 'Grace', age: 85 },
    ]);
    expect(hasHeader).toBe(true);
    expect(matrix[0]).toStrictEqual(['name', 'age']);
    expect(matrix[1]).toStrictEqual(['Ada', '36']);
  });

  it('parses JSON rows/headers envelope', () => {
    expect.hasAssertions();
    const { matrix, hasHeader } = parseJsonToMatrix({
      headers: ['x', 'y'],
      rows: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(hasHeader).toBe(true);
    expect(matrix).toStrictEqual([
      ['x', 'y'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });
});

describe('lazyTable commands', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('insertLazyTableShell stores lazy attrs', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('')])]));
    const ops = insertLazyTableShell({
      url: 'https://example.com/data.json',
      format: 'json',
      headers: true,
    })(state);
    expect(ops).not.toBeNull();
    if (ops === null) {
      throw new Error('insertLazyTableShell returned null');
    }
    state = applyTransaction(state, transaction(...ops)).state;
    const table = state.doc.content?.[1];
    expect(table).toBeDefined();
    if (table === undefined) {
      throw new Error('table block missing');
    }
    expect(table.type).toBe('table');
    expect(readLazyConfigFromTable(table)).toMatchObject({
      url: 'https://example.com/data.json',
      format: 'json',
    });
  });

  it('fillTableFromMatrix replaces selection table body', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('')])]));
    const shellOps = insertLazyTableShell({ url: 'https://example.com/t.json', headers: true })(
      state
    );
    expect(shellOps).not.toBeNull();
    if (shellOps === null) {
      throw new Error('insertLazyTableShell returned null');
    }
    state = applyTransaction(state, transaction(...shellOps)).state;
    const tp = findTablePath(state.doc, state.selection.anchor.path);
    expect(tp).toStrictEqual([1]);
    const fillOps = fillTableFromMatrix(
      [
        ['A', 'B'],
        ['1', '2'],
      ],
      true
    )(state);
    expect(fillOps).not.toBeNull();
    if (fillOps === null) {
      throw new Error('fillTableFromMatrix returned null');
    }
    state = applyTransaction(state, transaction(...fillOps)).state;
    const table = state.doc.content?.[1];
    expect(table).toBeDefined();
    if (table === undefined) {
      throw new Error('table block missing');
    }
    expect(table.content).toHaveLength(2);
    const cellA = table.content?.[0]?.content?.[0]?.content?.[0]?.content?.[0];
    const cellB = table.content?.[1]?.content?.[1]?.content?.[0]?.content?.[0];
    expect(cellA?.text).toBe('A');
    expect(cellB?.text).toBe('2');
  });

  it('assertSafeLazyUrl rejects private hosts', async () => {
    expect.hasAssertions();
    const { assertSafeLazyUrl, fetchLazyMatrix } = await import('../lazyTable');
    expect(() => assertSafeLazyUrl('file:///etc/passwd')).toThrow(/http/);
    expect(() => assertSafeLazyUrl('http://127.0.0.1/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://192.168.0.1/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://[::ffff:127.0.0.1]/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://localtest.me/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('https://example.com/ok.json')).not.toThrow();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('[["a"]]'),
        })
      )
    );
    await expect(
      fetchLazyMatrix({ url: 'https://example.com/ok.json', format: 'json' })
    ).resolves.toMatchObject({ matrix: [['a']] });
    expect(fetch).toHaveBeenCalledWith('https://example.com/ok.json', {
      credentials: 'omit',
      redirect: 'error',
    });
  });
});
