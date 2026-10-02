import type { ChartSeries } from '../types';
import type { ChartOptions } from '../types/ChartOptions';
import type { ChartI18n } from './types';
import {
  colorWithOpacity,
  drawAxisLabels,
  drawBackground,
  drawLegend,
  drawNoData,
  drawTitle,
  plotBox,
  textColor,
  themeColors,
} from '../canvas/kit';

export function paintRadar(
  ctx: CanvasRenderingContext2D,
  series: ChartSeries[],
  options: ChartOptions,
  i18n: ChartI18n
): void {
  drawBackground(ctx, options);
  drawTitle(ctx, options);
  if (series.length === 0 || !series[0]?.data.length) {
    drawNoData(ctx, options, i18n);
    return;
  }
  const { padding, plotW, plotH } = plotBox(options);
  const centerX = padding + plotW / 2;
  const centerY = padding + plotH / 2;
  const radius = Math.min(plotW, plotH) / 3;
  const categories = series[0].data.map((p) => p.label);
  const maxV = Math.max(1, ...series.flatMap((s) => s.data.map((p) => p.value ?? 0)));
  const colors = themeColors(options);
  const n = categories.length;

  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius * i) / 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  categories.forEach((_, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();
  });

  series.forEach((s, si) => {
    const color = s.color ?? colors[si % colors.length] ?? '#888';
    ctx.beginPath();
    s.data.forEach((p, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const r = (radius * (p.value ?? 0)) / maxV;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = colorWithOpacity(color, 0.2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  categories.forEach((cat, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    ctx.fillStyle = textColor(options);
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      cat,
      centerX + Math.cos(angle) * (radius + 20),
      centerY + Math.sin(angle) * (radius + 20)
    );
  });

  drawAxisLabels(ctx, options);
  drawLegend(ctx, series, options, i18n);
}
