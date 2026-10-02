import { readJsonAttr } from '@ocm/wysiwyg/utils/attrJson';
import type { ChartPoint, ChartSeries, ChartType } from '../types';
import type { ChartDriver, PointField } from '../drivers/types';
import { pointHasFields } from '../drivers/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isChartType(value: string): value is ChartType {
  return (
    value === 'bar' ||
    value === 'line' ||
    value === 'pie' ||
    value === 'doughnut' ||
    value === 'area' ||
    value === 'radar' ||
    value === 'scatter' ||
    value === 'bubble'
  );
}

export function parseChartType(value: string, fallback: ChartType = 'bar'): ChartType {
  return isChartType(value) ? value : fallback;
}

export function parseChartMode(value: string): 'default' | 'grouped' | 'stacked' {
  if (value === 'default' || value === 'grouped' || value === 'stacked') {
    return value;
  }
  return 'default';
}

export function parseChartOrientation(value: string): 'vertical' | 'horizontal' {
  if (value === 'vertical' || value === 'horizontal') {
    return value;
  }
  return 'vertical';
}

export function isChartPoint(item: unknown): item is ChartPoint {
  if (!isRecord(item)) {
    return false;
  }
  if (typeof item.label !== 'string' || !item.label.trim()) {
    return false;
  }
  if ('x' in item || 'y' in item) {
    return (
      typeof item.x === 'number' &&
      !Number.isNaN(item.x) &&
      typeof item.y === 'number' &&
      !Number.isNaN(item.y)
    );
  }
  return typeof item.value === 'number' && !Number.isNaN(item.value);
}

export function isChartSeries(item: unknown): item is ChartSeries {
  if (!isRecord(item)) {
    return false;
  }
  if (typeof item.name !== 'string' || !Array.isArray(item.data) || item.data.length === 0) {
    return false;
  }
  return item.data.every(isChartPoint);
}

export function parseChartDataJson(raw: unknown): ChartSeries[] {
  return normalizeChartData(readJsonAttr(raw, null));
}

/** Canonical: non-empty ChartSeries[]. */
export function validateSeries(data: unknown): data is ChartSeries[] {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  return data.every(isChartSeries);
}

export function validateSeriesForDriver(series: ChartSeries[], driver: ChartDriver): boolean {
  if (!validateSeries(series)) {
    return false;
  }
  if (driver.seriesMode === 'single' && series.length !== 1) {
    return false;
  }
  return series.every((s) => s.data.every((p) => pointHasFields(p, driver.fields)));
}

export function normalizeChartData(data: unknown): ChartSeries[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  if (isChartSeries(data[0])) {
    return data.filter(isChartSeries);
  }
  const points = data.filter(isChartPoint);
  if (points.length === 0) {
    return [];
  }
  return [{ name: 'Series 1', data: points }];
}

export function toChartPoint(partial: Partial<ChartPoint>): ChartPoint | null {
  if (!partial.label?.trim()) {
    return null;
  }
  if (partial.x !== undefined || partial.y !== undefined) {
    if (typeof partial.x !== 'number' || typeof partial.y !== 'number') {
      return null;
    }
    return {
      label: partial.label,
      x: partial.x,
      y: partial.y,
      value: partial.value ?? partial.y,
      r: partial.r,
      color: partial.color,
    };
  }
  if (typeof partial.value !== 'number') {
    return null;
  }
  return {
    label: partial.label,
    value: partial.value,
    color: partial.color,
  };
}

export function fieldsInclude(fields: readonly PointField[], f: PointField): boolean {
  return fields.includes(f);
}
