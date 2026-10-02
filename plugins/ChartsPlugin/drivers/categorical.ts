import type { ChartSeries } from '../types';
import type { ChartOptions } from '../types/ChartOptions';
import type { ChartI18n } from './types';
import {
  colorWithOpacity,
  drawAxisLabels,
  drawBackground,
  drawCategoryGrid,
  drawLegend,
  drawNoData,
  drawTitle,
  plotBox,
  roundRect,
  themeColors,
} from '../canvas/kit';

function maxValue(series: ChartSeries[], mode: string): number {
  const cats = series[0]?.data.length ?? 0;
  if (mode === 'stacked' && cats > 0) {
    return Math.max(
      1,
      ...Array.from({ length: cats }, (_, i) =>
        series.reduce((sum, s) => sum + (s.data[i]?.value ?? 0), 0)
      )
    );
  }
  return Math.max(1, ...series.flatMap((s) => s.data.map((p) => p.value ?? 0)));
}

function paintBars(
  ctx: CanvasRenderingContext2D,
  series: ChartSeries[],
  options: ChartOptions,
  colors: string[]
): void {
  const mode = options.mode ?? 'default';
  const orientation = options.orientation ?? 'vertical';
  const { padding, height, plotW, plotH } = plotBox(options);
  const mv = maxValue(series, mode);
  const n = series[0]?.data.length ?? 0;
  if (n === 0) {
    return;
  }

  if (orientation === 'vertical') {
    const slot = plotW / n;
    if (mode === 'stacked') {
      const barW = Math.max(12, slot / 1.5);
      for (let i = 0; i < n; i++) {
        let y = height - padding;
        series.forEach((s, si) => {
          const v = s.data[i]?.value ?? 0;
          const h = (v * plotH) / mv;
          y -= h;
          const x = padding + slot * i + (slot - barW) / 2;
          ctx.fillStyle = s.color ?? colors[si % colors.length] ?? '#888';
          roundRect(ctx, x, y, barW, h, 4);
          ctx.fill();
        });
      }
      return;
    }
    if (mode === 'grouped') {
      const groupW = Math.max(12, slot / 1.2);
      const barW = groupW / series.length;
      for (let i = 0; i < n; i++) {
        series.forEach((s, si) => {
          const v = s.data[i]?.value ?? 0;
          const h = (v * plotH) / mv;
          const x = padding + slot * i + (slot - groupW) / 2 + si * barW;
          const y = height - padding - h;
          ctx.fillStyle = s.color ?? colors[si % colors.length] ?? '#888';
          roundRect(ctx, x, y, barW, h, 4);
          ctx.fill();
        });
      }
      return;
    }
    const points = series[0]?.data ?? [];
    const barW = Math.max(12, slot / 1.5);
    points.forEach((p, i) => {
      const v = p.value ?? 0;
      const h = (v * plotH) / mv;
      const x = padding + slot * i + (slot - barW) / 2;
      const y = height - padding - h;
      const color = p.color ?? colors[i % colors.length] ?? '#888';
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, color);
      g.addColorStop(1, colorWithOpacity(color, 0.7));
      ctx.fillStyle = g;
      roundRect(ctx, x, y, barW, h, 4);
      ctx.fill();
    });
    return;
  }

  // horizontal
  const slot = plotH / n;
  if (mode === 'stacked') {
    const barH = Math.max(12, slot / 1.5);
    for (let i = 0; i < n; i++) {
      let x = padding;
      series.forEach((s, si) => {
        const v = s.data[i]?.value ?? 0;
        const w = (v * plotW) / mv;
        const y = padding + slot * i + (slot - barH) / 2;
        ctx.fillStyle = s.color ?? colors[si % colors.length] ?? '#888';
        roundRect(ctx, x, y, w, barH, 4);
        ctx.fill();
        x += w;
      });
    }
    return;
  }
  if (mode === 'grouped') {
    const groupH = Math.max(12, slot / 1.2);
    const barH = groupH / series.length;
    for (let i = 0; i < n; i++) {
      series.forEach((s, si) => {
        const v = s.data[i]?.value ?? 0;
        const w = (v * plotW) / mv;
        const y = padding + slot * i + (slot - groupH) / 2 + si * barH;
        ctx.fillStyle = s.color ?? colors[si % colors.length] ?? '#888';
        roundRect(ctx, padding, y, w, barH, 4);
        ctx.fill();
      });
    }
    return;
  }
  const points = series[0]?.data ?? [];
  const barH = Math.max(12, slot / 1.5);
  points.forEach((p, i) => {
    const v = p.value ?? 0;
    const w = (v * plotW) / mv;
    const y = padding + slot * i + (slot - barH) / 2;
    ctx.fillStyle = p.color ?? colors[i % colors.length] ?? '#888';
    roundRect(ctx, padding, y, w, barH, 4);
    ctx.fill();
  });
}

function paintLineOrArea(
  ctx: CanvasRenderingContext2D,
  series: ChartSeries[],
  options: ChartOptions,
  colors: string[],
  fill: boolean
): void {
  const mode = options.mode ?? 'default';
  const { padding, height, plotW, plotH } = plotBox(options);
  const mv = maxValue(series, fill && mode === 'stacked' ? 'stacked' : 'default') * 1.1;
  const scale = plotH / mv;

  const drawPath = (pts: { x: number; y: number }[], color: string, doFill: boolean) => {
    if (pts.length === 0) {
      return;
    }
    if (doFill) {
      ctx.beginPath();
      ctx.moveTo(pts[0]?.x ?? 0, height - padding);
      pts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(pts[pts.length - 1]?.x ?? 0, height - padding);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, padding, 0, height - padding);
      g.addColorStop(0, colorWithOpacity(color, 0.3));
      g.addColorStop(1, colorWithOpacity(color, 0.05));
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.beginPath();
    pts.forEach((pt, i) => {
      if (i === 0) {
        ctx.moveTo(pt.x, pt.y);
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    pts.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  if (fill && mode === 'stacked') {
    const n = series[0]?.data.length ?? 0;
    const stack = Array.from({ length: n }, () => 0);
    [...series].toReversed().forEach((s, si) => {
      const color = s.color ?? colors[si % colors.length] ?? '#888';
      const pts = s.data.map((p, i) => {
        stack[i] = (stack[i] ?? 0) + (p.value ?? 0);
        const x = padding + (plotW / Math.max(1, n - 1)) * i;
        const y = height - padding - (stack[i] ?? 0) * scale;
        return { x, y };
      });
      drawPath(pts, color, true);
    });
    return;
  }

  const list = fill ? [...series].toReversed() : series;
  list.forEach((s, si) => {
    const color = s.color ?? colors[si % colors.length] ?? '#888';
    const n = s.data.length;
    const pts = s.data.map((p, i) => ({
      x: padding + (plotW / Math.max(1, n - 1)) * i,
      y: height - padding - (p.value ?? 0) * scale,
    }));
    drawPath(pts, color, fill);
  });
}

export function paintCategorical(
  kind: 'bar' | 'line' | 'area',
  ctx: CanvasRenderingContext2D,
  series: ChartSeries[],
  options: ChartOptions,
  i18n: ChartI18n
): void {
  if (series.length === 0 || !series[0]?.data.length) {
    drawBackground(ctx, options);
    drawNoData(ctx, options, i18n);
    return;
  }
  const colors = themeColors(options);
  const labels = series[0].data.map((p) => p.label);
  const mv = maxValue(series, options.mode ?? 'default');
  drawBackground(ctx, options);
  drawTitle(ctx, options);
  drawCategoryGrid(
    ctx,
    options,
    mv,
    labels,
    kind === 'bar' ? 'bar' : kind === 'area' ? 'area' : 'line'
  );
  if (kind === 'bar') {
    paintBars(ctx, series, options, colors);
  } else {
    paintLineOrArea(ctx, series, options, colors, kind === 'area');
  }
  drawAxisLabels(ctx, options);
  drawLegend(ctx, series, options, i18n);
}
