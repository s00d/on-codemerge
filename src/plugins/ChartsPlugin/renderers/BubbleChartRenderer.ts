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

    const orientation = options.orientation || 'vertical';

    // Find data ranges
    const allPoints = data.flatMap((series) => series.data);
    const xMax = Math.max(...allPoints.map((p) => p.x || 0));
    const yMax = Math.max(...allPoints.map((p) => p.y || 0));
    const rMax = Math.max(...allPoints.map((p) => p.r || 0));

    // Draw background
    this.drawBackground(ctx, options);
    this.drawTitle(ctx, options);

    if (orientation === 'vertical') {
      this.drawGrid(ctx, options, yMax);
      this.drawAxes(ctx, options, xMax, yMax);
      // Draw bubbles from largest to smallest
      data.forEach((series) => {
        const sortedData = [...series.data].sort((a, b) => (b.value || 0) - (a.value || 0));
        series = { ...series, data: sortedData };
        this.drawBubbles(ctx, series, xMax, yMax, rMax, options);
      });
    } else {
      this.drawHorizontalGrid(ctx, options, xMax);
      this.drawHorizontalAxes(ctx, options, xMax, yMax);
      // Draw horizontal bubbles from largest to smallest
      data.forEach((series) => {
        const sortedData = [...series.data].sort((a, b) => (b.value || 0) - (a.value || 0));
        series = { ...series, data: sortedData };
        this.drawHorizontalBubbles(ctx, series, xMax, yMax, rMax, options);
      });
    }

    // Draw axis labels
    this.drawAxisLabels(ctx, options);

    // Draw legend
    this.drawLegend(ctx, data, options);
  }

  private drawBubbles(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    xMax: number,
    yMax: number,
    rMax: number,
    options: ChartOptions
  ): void {
    const { padding } = this.getDimensions(options);
    const colors = this.getColors(options);

    series.data.forEach((point) => {
      if (!point.x || !point.y || !point.r) return;

      const x = padding + point.x * xMax;
      const y = options.height - padding - point.y * yMax;
      const radius = point.r * rMax;

      // Draw bubble
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      // Create gradient
      const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);
      gradient.addColorStop(0, this.colorWithOpacity(point.color || colors[0], 0.6));
      gradient.addColorStop(1, this.colorWithOpacity(point.color || colors[0], 0.2));

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = point.color || colors[0];
      ctx.lineWidth = 2;
      ctx.stroke();
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

  private drawHorizontalBubbles(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    xMax: number,
    yMax: number,
    rMax: number,
    options: ChartOptions
  ): void {
    const { padding, width, height } = this.getDimensions(options);
    const xScale = height / xMax; // swapped
    const yScale = width / yMax; // swapped
    const rScale = Math.min(width, height) / (rMax * 20);
    const colors = this.getColors(options);

    series.data.forEach((point) => {
      if (!point.x || !point.y || !point.r) return;

      const x = padding + point.y * xScale; // swapped
      const y = options.height - padding - point.x * yScale; // swapped
      const radius = point.r * rScale;

      // Draw bubble
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      // Create gradient
      const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);
      gradient.addColorStop(0, this.colorWithOpacity(point.color || colors[0], 0.6));
      gradient.addColorStop(1, this.colorWithOpacity(point.color || colors[0], 0.2));

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = point.color || colors[0];
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}
