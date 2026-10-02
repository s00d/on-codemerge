import type { ChartPoint, ChartSeries } from '../types';
import type { ChartOptions } from '../types/ChartOptions';
import type { ChartI18n } from './types';
import {
  circleBox,
  colorWithOpacity,
  drawAxisLabels,
  drawBackground,
  drawLegend,
  drawNoData,
  drawTitle,
  textColor,
  themeColors,
} from '../canvas/kit';

export function paintPolar(
  ctx: CanvasRenderingContext2D,
  series: ChartSeries[],
  options: ChartOptions,
  i18n: ChartI18n,
  hole = 0
): void {
  const points = (series[0]?.data ?? []).filter((p) => (p.value ?? 0) > 0);
  const total = points.reduce((s, p) => s + (p.value ?? 0), 0);
  drawBackground(ctx, options);
  drawTitle(ctx, options);
  if (total <= 0 || points.length === 0) {
    drawNoData(ctx, options, i18n);
    return;
  }
  const { centerX, centerY, radius } = circleBox(options);
  const colors = themeColors(options);
  const startBase = (options.orientation ?? 'vertical') === 'vertical' ? -Math.PI / 2 : Math.PI / 2;
  let start = startBase;
  const inner = Math.max(0, Math.min(0.9, hole)) * radius;

  points.forEach((item, i) => {
    const slice = ((item.value ?? 0) / total) * Math.PI * 2;
    const end = start + slice;
    const color = item.color ?? colors[i % colors.length] ?? '#888';
    ctx.beginPath();
    if (inner > 0) {
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.arc(centerX, centerY, inner, end, start, true);
    } else {
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, end);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(centerX, centerY, inner, centerX, centerY, radius);
    g.addColorStop(0, colorWithOpacity(color, 0.8));
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    start = end;
  });

  // labels
  start = startBase;
  points.forEach((item) => {
    const slice = ((item.value ?? 0) / total) * Math.PI * 2;
    const mid = start + slice / 2;
    const lx = centerX + Math.cos(mid) * radius * 1.2;
    const ly = centerY + Math.sin(mid) * radius * 1.2;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(mid) * radius, centerY + Math.sin(mid) * radius);
    ctx.lineTo(lx, ly);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = textColor(options);
    ctx.textAlign = mid < Math.PI ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    const pct = (((item.value ?? 0) / total) * 100).toFixed(1);
    ctx.fillText(`${item.label} (${pct}%)`, lx, ly);
    start += slice;
  });

  if (inner > 0) {
    ctx.fillStyle = textColor(options);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillText(String(Math.round(total)), centerX, centerY);
  }

  drawAxisLabels(ctx, options);
  drawLegend(
    ctx,
    points.map((p: ChartPoint) => ({ name: p.label, color: p.color })),
    options,
    i18n
  );
}
