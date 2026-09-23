import { CHART_TYPE_CONFIGS } from '../constants/chartTypes';
import type { ChartPoint, ChartSeries, ChartType } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isChartType(value: string): value is ChartType {
  return Object.hasOwn(CHART_TYPE_CONFIGS, value);
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
  if (typeof raw !== 'string') {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return normalizeChartData(parsed);
  } catch {
    return [];
  }
}

export function validateChartData(data: unknown): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('Invalid chart data: Data must be a non-empty array');
    return false;
  }

  if (isChartSeries(data[0])) {
    return data.every((series) => {
      if (!isChartSeries(series)) {
        console.warn('Invalid series data: Each series must have a non-empty data array');
        return false;
      }
      return series.data.every((point) => isValidPoint(point));
    });
  }
  return data.every((point) => isChartPoint(point) && isValidPoint(point));
}

function isValidPoint(point: ChartPoint): boolean {
  if (typeof point !== 'object' || point === null) {
    console.warn('Invalid point: Must be an object');
    return false;
  }

  if (!point.label || typeof point.label !== 'string') {
    console.warn('Invalid point: Missing or invalid label');
    return false;
  }

  if ('x' in point || 'y' in point) {
    const hasValidX = typeof point.x === 'number' && !isNaN(point.x);
    const hasValidY = typeof point.y === 'number' && !isNaN(point.y);

    if (!hasValidX || !hasValidY) {
      console.warn('Invalid point: XY charts require valid x and y values');
      return false;
    }

    if ('r' in point && (typeof point.r !== 'number' || isNaN(point.r))) {
      console.warn('Invalid point: Bubble charts require valid radius (r) value');
      return false;
    }

    return true;
  }

  if (typeof point.value !== 'number' || isNaN(point.value)) {
    console.warn('Invalid point: Missing or invalid value');
    return false;
  }

  return true;
}

export function normalizeChartData(data: unknown): ChartSeries[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  if (isChartSeries(data[0])) {
    const series = data.filter(isChartSeries);
    return series;
  }

  const points = data.filter(isChartPoint);
  if (points.length === 0) {
    return [];
  }

  return [
    {
      name: 'Series 1',
      data: points,
    },
  ];
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
