import { isDarkHost } from '@codemerge/sdk';
import { CHART_COLORS, colorWithOpacity } from '../utils/colors';
import type { ChartOptions } from '../types/ChartOptions';
import type { ChartI18n } from '../drivers/types';

export type PlotBox = {
  padding: number;
  width: number;
  height: number;
  plotW: number;
  plotH: number;
};

export function plotBox(options: ChartOptions): PlotBox {
  const padding = Math.max(40, options.padding ?? 40);
  const plotW = Math.max(0, options.width - padding * 2);
  const plotH = Math.max(0, options.height - padding * 2);
  return { padding, width: options.width, height: options.height, plotW, plotH };
}

export function themeColors(options: ChartOptions): string[] {
  if (options.colors && options.colors.length > 0) {
    return options.colors;
  }
  return CHART_COLORS;
}

// Colors are baked into the PNG, so they follow the host scheme at paint time.
export function isDarkChart(options: ChartOptions): boolean {
  return options.dark ?? isDarkHost();
}

export function textColor(options: ChartOptions): string {
  return isDarkChart(options) ? '#fafafa' : '#222';
}

export function bgColor(options: ChartOptions): string {
  return isDarkChart(options) ? '#18181b' : '#fff';
}

export function mutedColor(options: ChartOptions): string {
  return isDarkChart(options) ? '#a1a1aa' : '#6b7280';
}

export function gridColor(options: ChartOptions): string {
  return isDarkChart(options) ? '#3f3f46' : '#e5e7eb';
}

export function drawBackground(ctx: CanvasRenderingContext2D, options: ChartOptions): void {
  ctx.save();
  ctx.fillStyle = bgColor(options);
  ctx.fillRect(0, 0, options.width, options.height);
  ctx.restore();
}

export function drawTitle(ctx: CanvasRenderingContext2D, options: ChartOptions): void {
  if (!options.title) {
    return;
  }
  ctx.save();
  ctx.fillStyle = textColor(options);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  ctx.fillText(options.title, options.width / 2, 20);
  ctx.restore();
}

export function drawNoData(
  ctx: CanvasRenderingContext2D,
  options: ChartOptions,
  i18n: ChartI18n
): void {
  ctx.save();
  ctx.fillStyle = mutedColor(options);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(i18n.t('charts.noValidDataPointsToDisplay'), options.width / 2, options.height / 2);
  ctx.restore();
}

export function drawAxisLabels(ctx: CanvasRenderingContext2D, options: ChartOptions): void {
  const { padding } = plotBox(options);
  ctx.save();
  ctx.fillStyle = textColor(options);
  ctx.font = '12px Inter, system-ui, sans-serif';
  if (options.xAxis?.title) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(options.xAxis.title, options.width / 2, options.height - padding + 30);
  }
  if (options.yAxis?.title) {
    ctx.save();
    ctx.translate(padding - 30, options.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.yAxis.title, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { name?: string; color?: string }[],
  options: ChartOptions,
  i18n: ChartI18n
): void {
  if (options.legend?.show === false) {
    return;
  }
  const { padding } = plotBox(options);
  const colors = themeColors(options);
  let x = padding;
  const y = padding / 2;
  items.forEach((item, i) => {
    const name = item.name ?? `${i18n.t('charts.series')} ${i + 1}`;
    const color = item.color ?? colors[i % colors.length] ?? '#888';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = colorWithOpacity(color, 0.3);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = textColor(options);
    ctx.textAlign = 'left';
    ctx.fillText(name, x + 15, y + 4);
    x += ctx.measureText(name).width + 40;
  });
}
