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
  clientWidth: number;
};

export type DerivedSlice = {
  columnIds: string[];
  pinnedLeft: string[];
  pinnedRight: string[];
  center: string[];
  /** Row ids after filter/sort/tree/group. */
  rowIds: string[];
  groups: DerivedGroup[];
  totalRowCount: number;
};

export type TableStoreListener = () => void;
