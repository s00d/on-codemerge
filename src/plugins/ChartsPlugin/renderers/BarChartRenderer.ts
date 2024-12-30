import type { ChartPoint, ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class BarChartRenderer extends BaseChartRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[] | ChartSeries[],
    options: ChartOptions
  ): void {
    // Validate data first
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    // Convert to single series format if needed
    const points = this.normalizeData(data);
    if (!points.length) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { width, height } = this.getDimensions(options);
    const barWidth = Math.max(20, width / Math.max(1, points.length) / 1.5);
    const maxValue = Math.max(1, ...points.map((d) => d.value || 0));
    const scale = height / maxValue;

    this.drawGrid(ctx, options, maxValue);
    this.drawBars(ctx, points, options, { barWidth, scale });
  }

  private normalizeData(data: ChartPoint[] | ChartSeries[]): ChartPoint[] {
    if (!data.length) return [];

    // If it's already single series
    if ('value' in data[0]) {
      return data as ChartPoint[];
    }

    // If it's multi-series, take the first series
    const series = data as ChartSeries[];
    return series[0]?.data || [];
  }

  private drawBars(
    ctx: CanvasRenderingContext2D,
    points: ChartPoint[],
    options: ChartOptions,
    { barWidth, scale }: { barWidth: number; scale: number }
  ): void {
    const { padding } = this.getDimensions(options);
    const totalWidth = options.width - padding * 2;
    const barSpacing = totalWidth / points.length;

    points.forEach((point, i) => {
      const value = point.value || 0;
      const x = padding + barSpacing * i + (barSpacing - barWidth) / 2;
      const barHeight = value * scale;
      const y = options.height - padding - barHeight;

      // Draw bar shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x + 2, y + 2, barWidth, barHeight);

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      const color = point.color || this.colors[i % this.colors.length];
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.colorWithOpacity(color, 0.7));

      ctx.fillStyle = gradient;
      this.roundRect(ctx, x, y, barWidth, barHeight, 4);
      ctx.fill();

      // Draw value on top of bar
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(value.toString(), x + barWidth / 2, y - 8);

      // Draw label below bar
      ctx.save();
      ctx.translate(x + barWidth / 2, options.height - padding + 8);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(point.label || '', 0, 0);
      ctx.restore();
    });
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
