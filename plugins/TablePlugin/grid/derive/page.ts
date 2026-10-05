import type { TableGridDoc } from '../../io/adapters';

export type PageSlice = {
  rowIds: string[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalRowCount: number;
};

export function pageRowIds(doc: TableGridDoc, rowIds: string[]): PageSlice {
  const totalRowCount = rowIds.length;
  const pag = doc.view?.pagination;
  if (!pag || !pag.pageSize || pag.pageSize <= 0) {
    return {
      rowIds,
      page: 0,
      pageSize: totalRowCount || 1,
      pageCount: 1,
      totalRowCount,
    };
  }
  const pageSize = Math.max(1, Math.floor(pag.pageSize));
  const pageCount = Math.max(1, Math.ceil(totalRowCount / pageSize) || 1);
  const page = Math.min(Math.max(0, Math.floor(pag.page)), pageCount - 1);
  const start = page * pageSize;
  return {
    rowIds: rowIds.slice(start, start + pageSize),
    page,
    pageSize,
    pageCount,
    totalRowCount,
  };
}
