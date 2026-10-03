import type { ChartPoint, ChartSeries, ChartType } from '../types';
import type { ChartOptions } from '../types/ChartOptions';

export type PointField = 'label' | 'value' | 'x' | 'y' | 'r' | 'color';
export type ChartFamily = 'categorical' | 'polar' | 'xy';
export type SeriesMode = 'multi' | 'single';

/** i18n surface used while painting (EditorAPI or publish stub). */
export type ChartI18n = { t: (key: string) => string };

export type ChartDriver = {
  readonly type: ChartType;
  readonly family: ChartFamily;
  readonly name: string;
  readonly icon: string;
  readonly seriesMode: SeriesMode;
  readonly fields: readonly PointField[];
  readonly supportsMode?: boolean;
  readonly supportsOrientation?: boolean;
  /** Doughnut hole ratio 0–1 (polar only). */
  readonly hole?: number;
  defaults: () => ChartSeries[];
  coerce: (from: ChartSeries[]) => ChartSeries[];
  /** Canvas paint — only scatter/bubble; other types use `@codemerge/mermaid`. */
  paint?: (
    ctx: CanvasRenderingContext2D,
    series: ChartSeries[],
    options: ChartOptions,
    i18n: ChartI18n
  ) => void;
};

export function pointHasFields(point: ChartPoint, fields: readonly PointField[]): boolean {
  for (const f of fields) {
    if (f === 'label') {
      if (typeof point.label !== 'string' || !point.label.trim()) {
        return false;
      }
      continue;
    }
    if (f === 'color') {
      continue;
    }
    const v = point[f];
    if (typeof v !== 'number' || Number.isNaN(v)) {
      return false;
    }
  }
  return true;
}
