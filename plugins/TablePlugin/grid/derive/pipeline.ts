import type { TableGridDoc } from '../../io/adapters';
import type { DerivedSlice } from '../types';
import { layoutColumns } from './columns';
import { filterRowIds } from './filter';
import { groupRowIds, isGroupRowId } from './group';
import { sortRowIds } from './sort';
import { flattenTreeRowIds } from './tree';

export function deriveGrid(doc: TableGridDoc): DerivedSlice {
  const layout = layoutColumns(doc);
  let rowIds = doc.rows.map((r) => r.id);
  rowIds = filterRowIds(doc, rowIds);
  rowIds = sortRowIds(doc, rowIds);
  const hasTree = doc.rows.some((r) => r.parentId);
  if (hasTree) {
    rowIds = flattenTreeRowIds(doc, rowIds);
  }
  const grouped = groupRowIds(
    doc,
    rowIds.filter((id) => !isGroupRowId(id))
  );
  rowIds = (doc.view?.groupBy?.length ?? 0) > 0 ? grouped.displayIds : rowIds;
  return {
    columnIds: layout.columnIds,
    pinnedLeft: layout.pinnedLeft,
    pinnedRight: layout.pinnedRight,
    center: layout.center,
    rowIds,
    groups: grouped.groups,
    totalRowCount: rowIds.length,
  };
}
