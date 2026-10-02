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

export function circleBox(options: ChartOptions) {
  return {
    centerX: options.width / 2,
    centerY: options.height / 2,
    radius: Math.min(options.width, options.height) / 2 - 60,
  };
}

export function themeColors(options: ChartOptions): string[] {
  if (options.colors && options.colors.length > 0) {
    return options.colors;
  }
  return CHART_COLORS;
}

export function textColor(_options: ChartOptions): string {
  return '#222';
}

export function gridColor(options: ChartOptions): string {
  return options.grid?.color ?? '#e5e7eb';
}

export function bgColor(_options: ChartOptions): string {
  return '#fff';
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
  ctx.fillStyle = '#6b7280';
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

/** Categorical Y-grid + optional X labels (bar/line/area). */
export function drawCategoryGrid(
  ctx: CanvasRenderingContext2D,
  options: ChartOptions,
  maxValue: number,
  xLabels: string[],
  kind: 'bar' | 'line' | 'area'
): void {
  if (options.grid?.show === false) {
    return;
  }
  const { padding, width, height, plotW, plotH } = plotBox(options);
  ctx.save();
  ctx.strokeStyle = gridColor(options);
  ctx.lineWidth = options.grid?.width ?? 1;
  ctx.globalAlpha = options.grid?.opacity ?? 0.3;
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px Inter, system-ui, sans-serif';
  for (let i = 0; i <= 5; i++) {
    const y = padding + (plotH * i) / 5;
    const value = Math.round(maxValue * (1 - i / 5));
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), padding - 10, y);
    ctx.globalAlpha = options.grid?.opacity ?? 0.3;
  }
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor(options);
  ctx.font = '11px Inter, system-ui, sans-serif';
  xLabels.forEach((label, i) => {
    const x =
      kind === 'bar'
        ? padding + (plotW / xLabels.length) * i + plotW / xLabels.length / 2
        : padding + (plotW / Math.max(1, xLabels.length - 1)) * i;
    ctx.save();
    ctx.translate(x, height - padding + 8);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export { colorWithOpacity };
