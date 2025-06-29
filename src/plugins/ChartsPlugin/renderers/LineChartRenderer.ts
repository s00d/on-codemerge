import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class LineChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    // Validate data first
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { height } = this.getDimensions(options);
    const colors = this.getColors(options);

    // Ensure data is array and has valid structure
    const validData = Array.isArray(data) ? data : [data];
    const maxValue = Math.max(
      ...validData.flatMap((series) => series.data.map((point) => point.value || 0))
    );

    const scale = height / (maxValue * 1.1); // Add 10% padding at the top

    // Draw background
    this.drawBackground(ctx, options);

    // Draw title
    this.drawTitle(ctx, options);

    // Draw grid
    this.drawGrid(
      ctx,
      options,
      maxValue,
      true,
      validData[0].data.map((p) => p.label),
      'line'
    );

    // Draw lines and points
    validData.forEach((series, index) => {
      const color = series.color || colors[index % colors.length];
      this.drawLine(ctx, series, options, scale, color);
      this.drawPoints(ctx, series, options, scale, color);
    });

    // Draw axis labels
    this.drawAxisLabels(ctx, options);

    // Draw legend
    this.drawLegend(ctx, validData, options);
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
      ctx.fillStyle = this.getTextColor(options);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(point.value?.toString() || '0', x, y - 8);
    });
  }
}
