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

    const orientation = options.orientation || 'vertical';
    const { centerX, centerY, radius } = this.getCircleDimensions(options);
    const innerRadius = radius * 0.6; // 60% of outer radius

    // Draw background
    this.drawBackground(ctx, options);

    // Draw title
    this.drawTitle(ctx, options);

    if (orientation === 'vertical') {
      this.drawVerticalSlices(
        ctx,
        validData,
        total,
        centerX,
        centerY,
        radius,
        innerRadius,
        options
      );
      this.drawVerticalLabels(ctx, validData, total, centerX, centerY, radius, options);
    } else {
      this.drawHorizontalSlices(
        ctx,
        validData,
        total,
        centerX,
        centerY,
        radius,
        innerRadius,
        options
      );
      this.drawHorizontalLabels(ctx, validData, total, centerX, centerY, radius, options);
    }

    this.drawCenterInfo(ctx, total, centerX, centerY, innerRadius, options);

    // Draw axis labels
    this.drawAxisLabels(ctx, options);

    // Draw legend
    this.drawLegend(ctx, data as any[], options);
  }

  private drawVerticalSlices(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    options: ChartOptions
  ): void {
    let startAngle = -Math.PI / 2;
    const colors = this.getColors(options);
    data.forEach((item, i) => {
      if (!item.value || item.value <= 0) return;
      const sliceAngle = (item.value / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      const color = item.color || colors[i % colors.length];
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
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      startAngle = endAngle;
    });
  }

  private drawHorizontalSlices(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    options: ChartOptions
  ): void {
    let startAngle = Math.PI / 2; // Start from right instead of top
    const colors = this.getColors(options);
    data.forEach((item, i) => {
      if (!item.value || item.value <= 0) return;
      const sliceAngle = (item.value / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      const color = item.color || colors[i % colors.length];
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
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      startAngle = endAngle;
    });
  }

  private drawVerticalLabels(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    radius: number,
    options: ChartOptions
  ): void {
    let startAngle = -Math.PI / 2;
    data.forEach((item, _i) => {
      if (!item.value || item.value <= 0) return;
      const sliceAngle = (item.value / total) * (Math.PI * 2);
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 1.2;
      const textX = centerX + Math.cos(midAngle) * labelRadius;
      const textY = centerY + Math.sin(midAngle) * labelRadius;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius);
      ctx.lineTo(textX, textY);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = this.getTextColor(options);
      ctx.textAlign = midAngle < Math.PI ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      const percentage = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${item.label} (${percentage}%)`, textX, textY);
      startAngle += sliceAngle;
    });
  }

  private drawHorizontalLabels(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[],
    total: number,
    centerX: number,
    centerY: number,
    radius: number,
    options: ChartOptions
  ): void {
    let startAngle = Math.PI / 2; // Start from right
    data.forEach((item, _i) => {
      if (!item.value || item.value <= 0) return;
      const sliceAngle = (item.value / total) * (Math.PI * 2);
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 1.2;
      const textX = centerX + Math.cos(midAngle) * labelRadius;
      const textY = centerY + Math.sin(midAngle) * labelRadius;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius);
      ctx.lineTo(textX, textY);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = this.getTextColor(options);
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
    innerRadius: number,
    options: ChartOptions
  ): void {
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.getTextColor(options);
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText('Total', centerX, centerY - 10);
    ctx.fillText(total.toString(), centerX, centerY + 10);
  }
}
