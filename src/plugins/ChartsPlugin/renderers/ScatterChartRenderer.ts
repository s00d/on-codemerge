import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';

export class ScatterChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    if (!data || data.length === 0) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const orientation = options.orientation || 'vertical';
    const colors = this.getColors(options);

    // Find data ranges
    const allPoints = data.flatMap((series) => series.data);
    const xMax = Math.max(...allPoints.map((p) => p.x || 0));
    const yMax = Math.max(...allPoints.map((p) => p.y || 0));

    // Draw background
    this.drawBackground(ctx, options);
    this.drawTitle(ctx, options);

    if (orientation === 'vertical') {
      this.drawGrid(ctx, options, yMax);
      this.drawAxes(ctx, options, xMax, yMax);
      // Draw points
      data.forEach((series, i) => {
        const color = series.color || colors[i % colors.length];
        this.drawPoints(ctx, series, xMax, yMax, color, options);
      });
    } else {
      this.drawHorizontalGrid(ctx, options, xMax);
      this.drawHorizontalAxes(ctx, options, xMax, yMax);
      // Draw horizontal points
      data.forEach((series, i) => {
        const color = series.color || colors[i % colors.length];
        this.drawHorizontalPoints(ctx, series, xMax, yMax, color, options);
      });
    }

    // Draw axis labels
    this.drawAxisLabels(ctx, options);

    // Draw legend
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
    xMax: number,
    yMax: number,
    color: string,
    options: ChartOptions
  ): void {
    const { padding } = this.getDimensions(options);

    series.data.forEach((point) => {
      if (!point.x || !point.y) return;

      const x = padding + point.x * xMax;
      const y = options.height - padding - point.y * yMax;

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = this.colorWithOpacity(color, 0.2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawHorizontalGrid(
    ctx: CanvasRenderingContext2D,
    options: ChartOptions,
    _xMax: number
  ): void {
    const { padding, width, height } = this.getDimensions(options);

    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.lineWidth = 1;

    // X-axis grid lines (now vertical)
    for (let i = 0; i <= 5; i++) {
      const x = padding + (width * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, options.height - padding);
      ctx.stroke();
    }

    // Y-axis grid lines (now horizontal)
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(options.width - padding, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawHorizontalAxes(
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

    // X-axis labels (now vertical)
    for (let i = 0; i <= 5; i++) {
      const x = padding + (width * i) / 5;
      const value = Math.round((xMax * i) / 5);
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x, options.height - padding + 20);
    }

    // Y-axis labels (now horizontal)
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height * i) / 5;
      const value = Math.round((yMax * i) / 5);
      ctx.textAlign = 'right';
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    ctx.restore();
  }

  private drawHorizontalPoints(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    xMax: number,
    yMax: number,
    color: string,
    options: ChartOptions
  ): void {
    const { padding, width, height } = this.getDimensions(options);
    const xScale = height / xMax; // swapped
    const yScale = width / yMax; // swapped

    series.data.forEach((point) => {
      if (!point.x || !point.y) return;

      const x = padding + point.y * xScale; // swapped
      const y = options.height - padding - point.x * yScale; // swapped

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = this.colorWithOpacity(color, 0.2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}
