import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class BubbleChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    // Validate data first
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { width, height } = this.getDimensions(options);

    // Find data ranges
    const allPoints = data.flatMap((series) => series.data);
    const xMax = Math.max(...allPoints.map((p) => p.x || 0));
    const yMax = Math.max(...allPoints.map((p) => p.y || 0));
    const rMax = Math.max(...allPoints.map((p) => p.r || 0));

    // Calculate scales
    const xScale = width / xMax;
    const yScale = height / yMax;
    const rScale = Math.min(width, height) / (rMax * 20); // Scale radius to reasonable size

    this.drawGrid(ctx, options, yMax);
    this.drawAxes(ctx, options, xMax, yMax);

    // Draw bubbles from largest to smallest
    data.forEach((series) => {
      const sortedData = [...series.data].sort((a, b) => (b.value || 0) - (a.value || 0));
      series = { ...series, data: sortedData };
      this.drawBubbles(ctx, series, xScale, yScale, rScale, options);
    });

    this.drawLegend(ctx, data, options);
  }

  private drawBubbles(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    xScale: number,
    yScale: number,
    rScale: number,
    options: ChartOptions
  ): void {
    const { padding } = this.getDimensions(options);

    series.data.forEach((point) => {
      if (!point.x || !point.y || !point.r) return;

      const x = padding + point.x * xScale;
      const y = options.height - padding - point.y * yScale;
      const radius = point.r * rScale;

      // Draw bubble
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      // Create gradient
      const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);
      gradient.addColorStop(0, this.colorWithOpacity(point.color, 0.6));
      gradient.addColorStop(1, this.colorWithOpacity(point.color, 0.2));

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = point.color || this.colors[0];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label below the bubble
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(point.label || '', x, y + radius + 5);
    });
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
}
