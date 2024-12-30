import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';

export class ScatterChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    if (!data || data.length === 0) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { width, height } = this.getDimensions(options);

    // Find data ranges
    const allPoints = data.flatMap((series) => series.data);
    const xMax = Math.max(...allPoints.map((p) => p.x || 0));
    const yMax = Math.max(...allPoints.map((p) => p.y || 0));

    // Calculate scales
    const xScale = width / xMax;
    const yScale = height / yMax;

    this.drawGrid(ctx, options, yMax);
    this.drawAxes(ctx, options, xMax, yMax);

    // Draw points
    data.forEach((series, i) => {
      const color = this.colors[i % this.colors.length];
      this.drawPoints(ctx, series, xScale, yScale, color, options);
    });

    this.drawLegend(ctx, data, options);
  }

  private drawAxes(
    ctx: CanvasRenderingContext2D,
    options: ChartOptions,
    xMax: number,
    yMax: number
  ): void {
    const { padding, width, height } = this.getDimensions(options);

    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.lineWidth = 1;

    // X-axis labels
    for (let i = 0; i <= 5; i++) {
      const x = padding + (width * i) / 5;
      const value = Math.round((xMax * i) / 5);

      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x, options.height - padding + 20);
    }

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const y = options.height - padding - (height * i) / 5;
      const value = Math.round((yMax * i) / 5);

      ctx.textAlign = 'right';
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    ctx.restore();
  }

  private drawPoints(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    xScale: number,
    yScale: number,
    color: string,
    options: ChartOptions
  ): void {
    const { padding } = this.getDimensions(options);

    series.data.forEach((point) => {
      if (!point.x || !point.y) return;

      const x = padding + point.x * xScale;
      const y = options.height - padding - point.y * yScale;

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = this.colorWithOpacity(color, 0.2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label below point
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(point.label, x, y + 10);
    });
  }
}
