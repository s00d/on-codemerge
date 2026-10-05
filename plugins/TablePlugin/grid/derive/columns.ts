import type { TableColumn, TableGridDoc } from '../../io/adapters';

export type ColumnLayout = {
  columnIds: string[];
  pinnedLeft: string[];
  pinnedRight: string[];
  center: string[];
  byId: Map<string, TableColumn>;
};

export function layoutColumns(doc: TableGridDoc): ColumnLayout {
  const byId = new Map(doc.columns.map((c) => [c.id, c]));
  const order =
    doc.view?.columnOrder && doc.view.columnOrder.length > 0
      ? doc.view.columnOrder.filter((id) => byId.has(id))
      : doc.columns.map((c) => c.id);
  for (const c of doc.columns) {
    if (!order.includes(c.id)) {
      order.push(c.id);
    }
  }
  const pinnedLeft: string[] = [];
  const pinnedRight: string[] = [];
  const center: string[] = [];
  for (const id of order) {
    const col = byId.get(id);
    if (!col) {
      continue;
    }
    if (col.pinned === 'left') {
      pinnedLeft.push(id);
    } else if (col.pinned === 'right') {
      pinnedRight.push(id);
    } else {
      center.push(id);
    }
  }
  return {
    columnIds: [...pinnedLeft, ...center, ...pinnedRight],
    pinnedLeft,
    pinnedRight,
    center,
    byId,
  };
}
