import type { TableGridDoc } from '../../io/adapters';
import { parseTableBoolean } from '../../io/adapters';
import { stringifyCell } from '../../io/matrix';
import { rowLookup } from './filter';

export function sortRowIds(doc: TableGridDoc, rowIds: string[]): string[] {
  const sort = doc.view?.sort;
  if (!sort || sort.length === 0) {
    return rowIds;
  }
  const byId = rowLookup(doc);
  const colType = new Map(doc.columns.map((c) => [c.id, c.type ?? 'text']));
  return [...rowIds].toSorted((a, b) => {
    const ra = byId.get(a);
    const rb = byId.get(b);
    if (!ra || !rb) {
      return 0;
    }
    for (const { colId, dir } of sort) {
      const va = ra.cells[colId] ?? null;
      const vb = rb.cells[colId] ?? null;
      const type = colType.get(colId) ?? 'text';
      let cmp = 0;
      if (type === 'number') {
        cmp = Number(va) - Number(vb);
        if (Number.isNaN(cmp)) {
          cmp = stringifyCell(va).localeCompare(stringifyCell(vb));
        }
      } else if (type === 'boolean') {
        cmp = Number(parseTableBoolean(va)) - Number(parseTableBoolean(vb));
      } else {
        cmp = stringifyCell(va).localeCompare(stringifyCell(vb), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }
      if (cmp !== 0) {
        return dir === 'desc' ? -cmp : cmp;
      }
    }
    return 0;
  });
}
