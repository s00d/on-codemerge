import type { ViewportWindow } from './types';

export const DEFAULT_ROW_HEIGHT = 32;
export const ROW_LINE_HEIGHT = 20;
export const ROW_LINE_PAD = 10;
export const ROW_LINE_CAP = 12;

export function lineCountInText(text: string): number {
  if (text === '') {
    return 1;
  }
  let n = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      n += 1;
    }
  }
  return n;
}

export function heightForLineCount(lines: number, base = DEFAULT_ROW_HEIGHT): number {
  const n = Math.min(ROW_LINE_CAP, Math.max(1, lines));
  if (n <= 1) {
    return base;
  }
  return Math.max(base, ROW_LINE_PAD + n * ROW_LINE_HEIGHT);
}

export function offsetsFromHeights(heights: number[]): number[] {
  const offsets: number[] = Array.from({ length: heights.length + 1 });
  offsets[0] = 0;
  for (let i = 0; i < heights.length; i++) {
    offsets[i + 1] = (offsets[i] ?? 0) + (heights[i] ?? 0);
  }
  return offsets;
}

export function visibleRangeFromOffsets(
  scrollTop: number,
  clientHeight: number,
  offsets: number[],
  overscan = 6
): { start: number; end: number } {
  const total = Math.max(0, offsets.length - 1);
  if (total === 0) {
    return { start: 0, end: 0 };
  }
  const y = Math.max(0, scrollTop);
  let lo = 0;
  let hi = total - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((offsets[mid] ?? 0) <= y) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  const start = Math.max(0, lo - overscan);
  const bottom = y + Math.max(1, clientHeight);
  let end = lo + 1;
  while (end < total && (offsets[end] ?? 0) < bottom) {
    end += 1;
  }
  return { start, end: Math.min(total, Math.max(end, lo + 1) + overscan) };
}

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
