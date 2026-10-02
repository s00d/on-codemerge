import type { ChartPoint, ChartSeries } from '../types';
import type { PointField } from './types';
import { getRandomColor } from '../utils/colors';

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}

function pointValue(p: ChartPoint, fallback: number): number {
  if (typeof p.value === 'number' && !Number.isNaN(p.value)) {
    return p.value;
  }
  if (typeof p.y === 'number' && !Number.isNaN(p.y)) {
    return p.y;
  }
  if (typeof p.x === 'number' && !Number.isNaN(p.x)) {
    return p.x;
  }
  return fallback;
}

export function categoricalDefaults(): ChartSeries[] {
  return [
    {
      name: 'Series 1',
      color: getRandomColor(),
      data: [
        { label: 'A', value: 12, color: getRandomColor() },
        { label: 'B', value: 19, color: getRandomColor() },
        { label: 'C', value: 8, color: getRandomColor() },
      ],
    },
  ];
}

export function polarDefaults(): ChartSeries[] {
  return [
    {
      name: 'Series 1',
      data: [
        { label: 'A', value: 30, color: getRandomColor() },
        { label: 'B', value: 45, color: getRandomColor() },
        { label: 'C', value: 25, color: getRandomColor() },
      ],
    },
  ];
}

export function xyDefaults(withR: boolean): ChartSeries[] {
  return [
    {
      name: 'Series 1',
      data: [
        {
          label: 'P1',
          x: 10,
          y: 20,
          value: 20,
          ...(withR ? { r: 8 } : {}),
          color: getRandomColor(),
        },
        {
          label: 'P2',
          x: 25,
          y: 15,
          value: 15,
          ...(withR ? { r: 12 } : {}),
          color: getRandomColor(),
        },
        {
          label: 'P3',
          x: 40,
          y: 30,
          value: 30,
          ...(withR ? { r: 6 } : {}),
          color: getRandomColor(),
        },
      ],
    },
  ];
}

function mapPoints(
  from: ChartSeries[],
  map: (p: ChartPoint, i: number) => ChartPoint,
  multi: boolean
): ChartSeries[] {
  if (from.length === 0) {
    return [];
  }
  const first = from[0];
  const sources = multi ? from : first === undefined ? [] : [first];
  return sources.map((s) => ({
    name: s.name,
    color: s.color,
    data: s.data.map(map),
  }));
}

export function coerceCategorical(from: ChartSeries[]): ChartSeries[] {
  const mapped = mapPoints(
    from,
    (p, i) => ({
      label: p.label.trim() ? p.label : `A${i + 1}`,
      value: pointValue(p, 0),
      color: p.color ?? getRandomColor(),
    }),
    true
  );
  return mapped.length > 0 ? mapped : categoricalDefaults();
}

export function coercePolar(from: ChartSeries[]): ChartSeries[] {
  const first = from[0];
  if (first === undefined || first.data.length === 0) {
    return polarDefaults();
  }
  return [
    {
      name: first.name,
      color: first.color,
      data: first.data.map((p, i) => ({
        label: p.label.trim() ? p.label : `A${i + 1}`,
        value: pointValue(p, 0),
        color: p.color ?? getRandomColor(),
      })),
    },
  ];
}

export function coerceXy(from: ChartSeries[], withR: boolean): ChartSeries[] {
  const first = from[0];
  if (first === undefined || first.data.length === 0) {
    return xyDefaults(withR);
  }
  return [
    {
      name: first.name,
      color: first.color,
      data: first.data.map((p, i) => {
        const value = pointValue(p, 10 + i * 5);
        const point: ChartPoint = {
          label: p.label.trim() ? p.label : `P${i + 1}`,
          x: num(p.x, value),
          y: num(p.y, value),
          value,
          color: p.color ?? getRandomColor(),
        };
        if (withR) {
          point.r = num(p.r, 5 + (i % 3) * 3);
        }
        return point;
      }),
    },
  ];
}

/** Ensure every required numeric field is present (editor / tests). */
export function assertFields(series: ChartSeries[], fields: readonly PointField[]): ChartSeries[] {
  return series.map((s) => ({
    ...s,
    data: s.data.map((p, i) => {
      const next: ChartPoint = { ...p, label: p.label.trim() ? p.label : `P${i + 1}` };
      for (const f of fields) {
        if (f === 'label' || f === 'color') {
          continue;
        }
        if (typeof next[f] !== 'number' || Number.isNaN(next[f])) {
          if (f === 'value') {
            next.value = pointValue(p, 0);
          } else if (f === 'x') {
            next.x = num(p.x, pointValue(p, i + 1));
          } else if (f === 'y') {
            next.y = num(p.y, pointValue(p, 10));
          } else if (f === 'r') {
            next.r = num(p.r, 8);
          }
        }
      }
      if (fields.includes('color') && !next.color) {
        next.color = getRandomColor();
      }
      return next;
    }),
  }));
}
