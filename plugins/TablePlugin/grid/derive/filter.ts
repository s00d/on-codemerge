import type { CellValue, TableGridDoc, TableRow } from '../../io/adapters';
import { stringifyCell } from '../../io/matrix';

function cellMatches(value: CellValue, op: string, expected: unknown): boolean {
  const s = stringifyCell(value).toLowerCase();
  const e = stringifyCell(expected).toLowerCase();
  switch (op) {
    case 'eq':
      return s === e;
    case 'neq':
      return s !== e;
    case 'contains':
      return s.includes(e);
    case 'startsWith':
      return s.startsWith(e);
    case 'empty':
      return s.length === 0;
    case 'notEmpty':
      return s.length > 0;
    case 'gt':
      return Number(value) > Number(expected);
    case 'lt':
      return Number(value) < Number(expected);
    default:
      return s.includes(e);
  }
}

export function filterRowIds(doc: TableGridDoc, rowIds: string[]): string[] {
  const byId = new Map(doc.rows.map((r) => [r.id, r]));
  const filters = doc.view?.filters;
  const quick = doc.view?.quickFilter?.trim().toLowerCase() ?? '';

  return rowIds.filter((id) => {
    const row = byId.get(id);
    if (!row) {
      return false;
    }
    if (filters) {
      for (const [colId, f] of Object.entries(filters)) {
        if (!cellMatches(row.cells[colId] ?? null, f.op, f.value)) {
          return false;
        }
      }
    }
    if (quick) {
      const hay = Object.values(row.cells)
        .map((c) => stringifyCell(c).toLowerCase())
        .join('\n');
      if (!hay.includes(quick)) {
        return false;
      }
    }
    return true;
  });
}

export function rowLookup(doc: TableGridDoc): Map<string, TableRow> {
  return new Map(doc.rows.map((r) => [r.id, r]));
}
