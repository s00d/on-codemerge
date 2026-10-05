import { canvas, renderDetached, cssColorToHex } from '@codemerge/sdk';
import { render as renderMermaid } from '@codemerge/mermaid';

import type { ChartPoint, ChartSeries, ChartType } from '../types';
import type { ChartOptions } from '../types/ChartOptions';
import { CHART_COLORS } from '../utils/colors';
import { normalizeChartData } from '../utils/validation';
import { getDriver } from './registry';
import { isMermaidChartType, toMermaidSource } from './toMermaidSource';
import type { ChartI18n } from './types';

export type { ChartI18n } from './types';

function themeFromOptions(options: ChartOptions): {
  bg: string;
  fg: string;
  accent?: string;
  surface?: string;
  border?: string;
  line?: string;
} {
  return {
    bg: '#ffffff',
    fg: '#18181b',
    accent: options.colors?.[0] ?? '#3f3f46',
    surface: '#f4f4f5',
    border: '#d4d4d8',
    line: '#a1a1aa',
  };
}

function toHexColor(raw: string | undefined): string | null {
  if (raw === undefined || raw.trim() === '') {
    return null;
  }
  return cssColorToHex(raw) ?? (raw.startsWith('#') ? raw : null);
}

/** Series/slice fills for mermaid render — options.colors → point/series color → CHART_COLORS. */
export function paletteFromSeries(
  series: ChartSeries[],
  options: ChartOptions,
  type: ChartType
): string[] {
  const fromOpt = (options.colors ?? [])
    .map((c) => toHexColor(c))
    .filter((c): c is string => c !== null);
  if (fromOpt.length > 0) {
    return fromOpt;
  }

  if (type === 'pie' || type === 'doughnut') {
    const pts = series[0]?.data ?? [];
    const slice = pts.map((p) => toHexColor(p.color)).filter((c): c is string => c !== null);
    if (slice.length > 0) {
      return slice;
    }
  }

  // Single-series bar: per-point colors (canvas parity); series.color is legend only.
  if (type === 'bar' && series.length === 1) {
    const pts = series[0]?.data ?? [];
    const pointColors = pts.map((p) => toHexColor(p.color)).filter((c): c is string => c !== null);
    if (pointColors.length > 0) {
      return pointColors;
    }
  }

  const seriesColors = series
    .map((s) => toHexColor(s.color))
    .filter((c): c is string => c !== null);
  if (seriesColors.length > 0) {
    return seriesColors;
  }

  return [...CHART_COLORS];
}

function svgToImage(svg: string, width: number, height: number): HTMLImageElement {
  const img = new Image();
  img.className = 'svg-chart';
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  img.width = width;
  img.height = height;
  return img;
}

function renderXyCanvas(
  type: 'scatter' | 'bubble',
  series: ChartSeries[],
  options: ChartOptions,
  i18n: ChartI18n
): HTMLImageElement {
  const driver = getDriver(type);
  const paint = driver.paint;
  if (paint === undefined) {
    throw new Error(`No canvas paint for ${type}`);
  }
  const { el } = renderDetached(canvas());
  if (!(el instanceof HTMLCanvasElement)) {
    throw new Error('Chart canvas element expected');
  }
  const dpr = globalThis.devicePixelRatio || 1;
  el.width = options.width * dpr;
  el.height = options.height * dpr;
  el.style.width = `${options.width}px`;
  el.style.height = `${options.height}px`;
  const ctx = el.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  ctx.scale(dpr, dpr);
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  paint(ctx, series, options, i18n);
  const img = new Image();
  img.className = 'svg-chart';
  img.src = el.toDataURL('image/png');
  img.width = options.width;
  img.height = options.height;
  return img;
}

/** Paint chart to image (mermaid SVG for most types; canvas PNG for scatter/bubble). */
export function renderChart(
  type: ChartType,
  data: ChartPoint[] | ChartSeries[],
  options: ChartOptions,
  i18n: ChartI18n
): HTMLImageElement {
  const driver = getDriver(type);
  const series = driver.coerce(normalizeChartData(data));

  if (isMermaidChartType(type)) {
    const source = toMermaidSource(type, series, options);
    const svg = renderMermaid(source, {
      theme: themeFromOptions(options),
      palette: paletteFromSeries(series, options, type),
    });
    return svgToImage(svg, options.width, options.height);
  }

  if (type === 'scatter' || type === 'bubble') {
    return renderXyCanvas(type, series, options, i18n);
  }

  throw new Error(`Unsupported chart type: ${type}`);
}
