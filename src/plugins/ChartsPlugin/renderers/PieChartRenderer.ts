import type { ChartPoint, ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class PieChartRenderer extends BaseChartRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[] | ChartSeries[],
    options: ChartOptions
  ): void {
    // Validate and normalize data
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    // Convert multi-series to single series if needed
    const points = this.normalizeData(data);
    if (!points.length) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { centerX, centerY, radius } = this.getCircleDimensions(options);
    const total = points.reduce((sum, point) => sum + (point.value || 0), 0);

    if (total <= 0) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    this.drawSlices(ctx, points, total, centerX, centerY, radius);
    this.drawLabels(ctx, points, total, centerX, centerY, radius);
    this.drawCenterInfo(ctx, total, centerX, centerY);
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

  private drawSlices(
    ctx: CanvasRenderingContext2D,
    points: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    let startAngle = -Math.PI / 2;

    points.forEach((point, i) => {
      const value = point.value || 0;
      if (value <= 0) return;

      const sliceAngle = (value / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Fill with gradient
      const color = point.color || this.colors[i % this.colors.length];
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, this.colorWithOpacity(color, 0.8));
      gradient.addColorStop(1, color);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add white border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });
  }

  private drawLabels(
    ctx: CanvasRenderingContext2D,
    points: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    let startAngle = -Math.PI / 2;

    points.forEach((point, _i) => {
      const value = point.value || 0;
      if (value <= 0) return;

      const sliceAngle = (value / total) * (Math.PI * 2);
      const midAngle = startAngle + sliceAngle / 2;

      // Calculate label position
      const labelRadius = radius * 1.2;
      const textX = centerX + Math.cos(midAngle) * labelRadius;
      const textY = centerY + Math.sin(midAngle) * labelRadius;

      // Draw connector line
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius);
      ctx.lineTo(textX, textY);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw label with percentage
      ctx.fillStyle = '#374151';
      ctx.textAlign = midAngle < Math.PI ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      const percentage = ((value / total) * 100).toFixed(1);
      ctx.fillText(`${point.label || ''} (${percentage}%)`, textX, textY);

      startAngle += sliceAngle;
    });
  }

  private drawCenterInfo(
    ctx: CanvasRenderingContext2D,
    total: number,
    centerX: number,
    centerY: number
  ): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText('Total', centerX, centerY - 10);
    ctx.fillText(total.toLocaleString(), centerX, centerY + 10);
  }
}
