import type { ChartPoint, ChartSeries } from '../types';

export function isChartSeries(item: ChartPoint | ChartSeries): item is ChartSeries {
  return (item as ChartSeries).data !== undefined && Array.isArray((item as ChartSeries).data);
}

export function validateChartData(data: ChartPoint[] | ChartSeries[]): boolean {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('Invalid chart data: Data must be a non-empty array');
    return false;
  }

  if (isChartSeries(data[0])) {
    // Multi-series data
    return data.every((series) => {
      const seriesData = series as ChartSeries;
      if (!seriesData.data || !Array.isArray(seriesData.data) || seriesData.data.length === 0) {
        console.warn('Invalid series data: Each series must have a non-empty data array');
        return false;
      }
      return seriesData.data.every((point) => isValidPoint(point));
    });
  } else {
    return data.every((point) => isValidPoint(point as ChartPoint));
  }
}

function isValidPoint(point: ChartPoint): boolean {
  if (!point || typeof point !== 'object') {
    console.warn('Invalid point: Must be an object');
    return false;
  }

  // Check required label
  if (!point.label || typeof point.label !== 'string') {
    console.warn('Invalid point: Missing or invalid label');
    return false;
  }

  // For XY charts (scatter, bubble)
  if ('x' in point || 'y' in point) {
    const hasValidX = typeof point.x === 'number' && !isNaN(point.x);
    const hasValidY = typeof point.y === 'number' && !isNaN(point.y);

    if (!hasValidX || !hasValidY) {
      console.warn('Invalid point: XY charts require valid x and y values');
      return false;
    }

    // For bubble charts
    if ('r' in point && (typeof point.r !== 'number' || isNaN(point.r))) {
      console.warn('Invalid point: Bubble charts require valid radius (r) value');
      return false;
    }

    return true;
  }

  // For regular charts
  if (typeof point.value !== 'number' || isNaN(point.value)) {
    console.warn('Invalid point: Missing or invalid value');
    return false;
  }

  return true;
}

export function normalizeChartData(data: ChartPoint[] | ChartSeries[]): ChartSeries[] {
  if (!data.length) return [];

  // If it's already multi-series
  if ('data' in data[0]) {
    return data as ChartSeries[];
  }

  // Convert single series to multi-series format
  return [
    {
      name: 'Series 1',
      data: data as ChartPoint[],
    },
  ];
}
