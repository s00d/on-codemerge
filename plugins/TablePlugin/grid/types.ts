import type { DerivedGroup } from './derive/group';

export type GridSelection = {
  /** Selected row ids (document order among selected). */
  rowIds: string[];
  /** Active cell for keyboard / edit. */
  active?: { rowId: string; colId: string } | null;
};

export type ViewportWindow = {
  start: number;
  end: number;
  rowHeight: number;
  clientHeight: number;
};

export type DerivedSlice = {
  /** Visible column ids after order + pin (left, center, right). */
  columnIds: string[];
  pinnedLeft: string[];
  pinnedRight: string[];
  center: string[];
  /** Row ids after filter/sort/tree/group/page. */
  rowIds: string[];
  /** Same pipeline as rowIds but before pagination (paste / full-order consumers). */
  orderedRowIds: string[];
  /** Pre-page groups from the same derive pipeline as rowIds (empty when no groupBy). */
  groups: DerivedGroup[];
  totalRowCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type TableStoreListener = () => void;
