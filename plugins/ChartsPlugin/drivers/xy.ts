import type { ChartSeries } from '../types';
import type { ChartOptions } from '../types/ChartOptions';
import type { ChartI18n } from './types';
import { colorWithOpacity } from '../utils/colors';
import {
  drawAxisLabels,
  drawBackground,
  drawLegend,
  drawNoData,
  drawTitle,
  plotBox,
  themeColors,
} from '../canvas/kit';

function finite(v: number | undefined): v is number {
  return v !== undefined && Number.isFinite(v);
}

/** Up to 2 decimals so 0..1 ranges don't collapse to 0/1 ticks. */
function tickLabel(v: number): string {
  return String(Math.round(v * 100) / 100);
}

export function paintXy(
  ctx: CanvasRenderingContext2D,
  series: ChartSeries[],
  options: ChartOptions,
  i18n: ChartI18n,
  withR: boolean
): void {
  drawBackground(ctx, options);
  drawTitle(ctx, options);
  const all = series.flatMap((s) => s.data);
  if (all.length === 0) {
    drawNoData(ctx, options, i18n);
    return;
  }
  // Axes include 0 and extend to negatives so points never land outside the plot box.
  const xs = all.map((p) => p.x).filter(finite);
  const ys = all.map((p) => p.y).filter(finite);
  const xMin = Math.min(0, ...xs);
  const yMin = Math.min(0, ...ys);
  const xMax = Math.max(xMin + 1, ...xs);
  const yMax = Math.max(yMin + 1, ...ys);
  const rMax = withR ? Math.max(1, ...all.map((p) => p.r ?? 0)) : 1;
  const { padding, height, plotW, plotH } = plotBox(options);
  const colors = themeColors(options);

  // axes ticks
  ctx.save();
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px Inter, system-ui, sans-serif';
  for (let i = 0; i <= 5; i++) {
    const x = padding + (plotW * i) / 5;
    ctx.textAlign = 'center';
    ctx.fillText(tickLabel(xMin + ((xMax - xMin) * i) / 5), x, height - padding + 20);
    const y = height - padding - (plotH * i) / 5;
    ctx.textAlign = 'right';
    ctx.fillText(tickLabel(yMin + ((yMax - yMin) * i) / 5), padding - 10, y + 4);
  }
  ctx.restore();

  if (options.grid?.show !== false) {
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.globalAlpha = 0.3;
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (plotH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotW, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const xScale = plotW / (xMax - xMin);
  const yScale = plotH / (yMax - yMin);
  const rScale = Math.min(plotW, plotH) / (rMax * 20);

  series.forEach((s, si) => {
    const base = s.color ?? colors[si % colors.length] ?? '#888';
    s.data.forEach((p) => {
      if (!finite(p.x) || !finite(p.y)) {
        return;
      }
      const x = padding + (p.x - xMin) * xScale;
      const y = height - padding - (p.y - yMin) * yScale;
      const color = p.color ?? base;
      if (withR) {
        const radius = Math.max(4, (p.r ?? 5) * rScale);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = colorWithOpacity(color, 0.35);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = colorWithOpacity(color, 0.2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  });

  drawAxisLabels(ctx, options);
  drawLegend(ctx, series, options, i18n);
}
