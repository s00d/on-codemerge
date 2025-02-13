import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class AreaChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    // Validate data first
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { height } = this.getDimensions(options);

    // Ensure data is array and has valid structure
    const validData = Array.isArray(data) ? data : [data];
    const maxValue = Math.max(
      ...validData.flatMap((series) => series.data.map((point) => point.value || 0))
    );

    const scale = height / (maxValue * 1.1); // Add 10% padding at the top

    this.drawGrid(ctx, options, maxValue);
    this.drawAxisLabels(
      ctx,
      validData[0].data.map((p) => p.label),
      options
    );

    // Draw areas from back to front
    [...validData].reverse().forEach((series, index) => {
      const color = series.color || this.colors[index % this.colors.length];
      this.drawAreaShape(ctx, series, options, scale, color);
    });

    // Draw lines and points from front to back
    validData.forEach((series, index) => {
      const color = series.color || this.colors[index % this.colors.length];
      this.drawLine(ctx, series, options, scale, color);
      this.drawPoints(ctx, series, options, scale, color);
    });

    this.drawLegend(ctx, validData, options);
  }

  private drawAreaShape(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    options: ChartOptions,
    scale: number,
    color: string
  ): void {
    const { padding, width } = this.getDimensions(options);
    const points = series.data;

    ctx.beginPath();
    ctx.moveTo(padding, options.height - padding);

    points.forEach((point, i) => {
      const x = padding + (width / (points.length - 1)) * i;
      const y = options.height - padding - (point.value || 0) * scale;
      if (i === 0) {
        ctx.moveTo(x, options.height - padding);
      }
      ctx.lineTo(x, y);
    });

    ctx.lineTo(options.width - padding, options.height - padding);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding, 0, options.height - padding);
    gradient.addColorStop(0, this.colorWithOpacity(color, 0.3));
    gradient.addColorStop(1, this.colorWithOpacity(color, 0.05));
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    options: ChartOptions,
    scale: number,
    color: string
  ): void {
    const { padding, width } = this.getDimensions(options);
    const points = series.data;

    ctx.beginPath();
    points.forEach((point, i) => {
      const x = padding + (width / (points.length - 1)) * i;
      const y = options.height - padding - (point.value || 0) * scale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawPoints(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    options: ChartOptions,
    scale: number,
    color: string
  ): void {
    const { padding, width } = this.getDimensions(options);
    const points = series.data;

    points.forEach((point, i) => {
      const x = padding + (width / (points.length - 1)) * i;
      const y = options.height - padding - (point.value || 0) * scale;

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw value above point
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(point.value?.toString() || '0', x, y - 8);
    });
  }

  private drawAxisLabels(
    ctx: CanvasRenderingContext2D,
    labels: string[],
    options: ChartOptions
  ): void {
    const { padding, width } = this.getDimensions(options);

    ctx.save();
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.font = '12px Inter, system-ui, sans-serif';

    labels.forEach((label, i) => {
      const x = padding + (width / (labels.length - 1)) * i;
      const y = options.height - padding + 20;

      // Rotate labels for better readability
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(label || '', 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }
}
