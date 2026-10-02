import { canvas, renderDetached } from '@codemerge/sdk';
import type { ChartPoint, ChartSeries, ChartType } from '../types';
import type { ChartOptions } from '../types/ChartOptions';
import { normalizeChartData } from '../utils/validation';
import type { ChartI18n } from './types';
import { getDriver } from './registry';

export type { ChartI18n } from './types';

/** Paint chart to PNG image (canvas → data URL). */
export function renderChart(
  type: ChartType,
  data: ChartPoint[] | ChartSeries[],
  options: ChartOptions,
  i18n: ChartI18n
): HTMLImageElement {
  const driver = getDriver(type);
  const series = driver.coerce(normalizeChartData(data));

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

  driver.paint(ctx, series, options, i18n);

  const img = new Image();
  img.className = 'svg-chart';
  img.src = el.toDataURL('image/png');
  img.width = options.width;
  img.height = options.height;
  return img;
}
