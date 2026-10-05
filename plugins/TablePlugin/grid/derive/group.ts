import type { CellValue, TableGridDoc } from '../../io/adapters';
import { stringifyCell } from '../../io/matrix';
import { rowLookup } from './filter';

export type GroupAgg = { sum: number; count: number; avg: number };

export type DerivedGroup = {
  key: string;
  colId: string;
  value: CellValue;
  rowIds: string[];
  agg: Record<string, GroupAgg>;
};

/** Group flat row ids by view.groupBy[0] (single level). */
export function groupRowIds(
  doc: TableGridDoc,
  rowIds: string[]
): {
  /** Interleaved: group marker ids `__group__:` + member row ids when expanded via expandedGroupIds */
  displayIds: string[];
  groups: DerivedGroup[];
} {
  const groupBy = doc.view?.groupBy?.[0];
  if (!groupBy) {
    return { displayIds: rowIds, groups: [] };
  }
  const byId = rowLookup(doc);
  const buckets = new Map<string, string[]>();
  for (const id of rowIds) {
    const row = byId.get(id);
    if (!row) {
      continue;
    }
    const key = stringifyCell(row.cells[groupBy] ?? null);
    const list = buckets.get(key) ?? [];
    list.push(id);
    buckets.set(key, list);
  }
  const numericCols = doc.columns.filter((c) => c.type === 'number').map((c) => c.id);
  const groups: DerivedGroup[] = [];
  const displayIds: string[] = [];
  const expanded = new Set(
    doc.view?.expandedGroupIds ?? [...buckets.keys()].map((k) => `__group__:${k}`)
  );

  for (const [key, ids] of buckets) {
    const agg: Record<string, GroupAgg> = {};
    for (const colId of numericCols) {
      let sum = 0;
      let count = 0;
      for (const id of ids) {
        const v = Number(byId.get(id)?.cells[colId]);
        if (Number.isFinite(v)) {
          sum += v;
          count += 1;
        }
      }
      agg[colId] = { sum, count, avg: count > 0 ? sum / count : 0 };
    }
    const groupId = `__group__:${key}`;
    groups.push({
      key: groupId,
      colId: groupBy,
      value: key,
      rowIds: ids,
      agg,
    });
    displayIds.push(groupId);
    if (expanded.has(groupId)) {
      displayIds.push(...ids);
    }
  }
  return { displayIds, groups };
}

export function isGroupRowId(id: string): boolean {
  return id.startsWith('__group__:');
}
