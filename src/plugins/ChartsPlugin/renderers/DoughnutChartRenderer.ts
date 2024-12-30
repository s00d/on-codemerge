import type { ChartPoint, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';

export class DoughnutChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartPoint[], options: ChartOptions): void {
    if (!data || data.length === 0) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    // Filter out invalid data points and calculate total
    const validData = data.filter((item) => item.value > 0);
    const total = validData.reduce((sum, item) => sum + item.value, 0);

    if (total <= 0 || validData.length === 0) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { centerX, centerY, radius } = this.getCircleDimensions(options);
    const innerRadius = radius * 0.6; // 60% of outer radius

    this.drawSlices(ctx, validData, total, centerX, centerY, radius, innerRadius);
    this.drawLabels(ctx, validData, total, centerX, centerY, radius);
    this.drawCenterInfo(ctx, total, centerX, centerY, innerRadius);
  }

  private drawSlices(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let startAngle = -Math.PI / 2;

    data.forEach((item, i) => {
      if (!item.value || item.value <= 0) return;

      const sliceAngle = (item.value / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      // const midAngle = startAngle + sliceAngle / 2;

      // Draw slice
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      // Fill with gradient
      const color = item.color || this.colors[i % this.colors.length];
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        innerRadius,
        centerX,
        centerY,
        outerRadius
      );
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
    data: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    let startAngle = -Math.PI / 2;

    data.forEach((item, _i) => {
      if (!item.value || item.value <= 0) return;

      const sliceAngle = (item.value / total) * (Math.PI * 2);
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
      const percentage = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${item.label} (${percentage}%)`, textX, textY);

      startAngle += sliceAngle;
    });
  }

  private drawCenterInfo(
    ctx: CanvasRenderingContext2D,
    total: number,
    centerX: number,
    centerY: number,
    innerRadius: number
  ): void {
    // Clear center area
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw total in center
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText('Total', centerX, centerY - 10);
    ctx.fillText(total.toString(), centerX, centerY + 10);
  }
}
