import type { ViewportWindow } from './types';

export const DEFAULT_ROW_HEIGHT = 32;

export function visibleWindow(
  scrollTop: number,
  clientHeight: number,
  totalRows: number,
  rowHeight = DEFAULT_ROW_HEIGHT,
  overscan = 6
): ViewportWindow {
  const rh = Math.max(1, rowHeight);
  const start = Math.max(0, Math.floor(scrollTop / rh) - overscan);
  const visible = Math.ceil(clientHeight / rh) + overscan * 2;
  const end = Math.min(totalRows, start + visible);
  return { start, end, rowHeight: rh, clientHeight, clientWidth: 0 };
}
