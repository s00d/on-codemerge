import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class RadarChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const orientation = options.orientation || 'vertical';
    const colors = this.getColors(options);

    // Draw background
    this.drawBackground(ctx, options);
    this.drawTitle(ctx, options);

    if (orientation === 'vertical') {
      this.drawVerticalRadar(ctx, data, options, colors);
    } else {
      this.drawHorizontalRadar(ctx, data, options, colors);
    }

    // Draw axis labels
    this.drawAxisLabels(ctx, options);

    // Draw legend
    this.drawLegend(ctx, data, options);
  }

  private drawVerticalRadar(
    ctx: CanvasRenderingContext2D,
    data: ChartSeries[],
    options: ChartOptions,
    colors: string[]
  ): void {
    const { width, height } = this.getDimensions(options);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    const categories = data[0].data.map((p) => p.label || '');
    const maxValue = Math.max(...data.flatMap((s) => s.data.map((p) => p.value || 0)), 1);

    // Draw grid circles
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw category lines
    categories.forEach((_, i) => {
      const angle = (i * 2 * Math.PI) / categories.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw data
    data.forEach((series, seriesIndex) => {
      const color = series.color || colors[seriesIndex % colors.length];
      ctx.beginPath();
      series.data.forEach((point, i) => {
        const angle = (i * 2 * Math.PI) / categories.length - Math.PI / 2;
        const value = point.value || 0;
        const r = (radius * value) / maxValue;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fillStyle = this.colorWithOpacity(color, 0.2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw category labels
    categories.forEach((category, i) => {
      const angle = (i * 2 * Math.PI) / categories.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);
      ctx.fillStyle = this.getTextColor(options);
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(category, x, y);
    });
  }

  private drawHorizontalRadar(
    ctx: CanvasRenderingContext2D,
    data: ChartSeries[],
    options: ChartOptions,
    colors: string[]
  ): void {
    const { width, height } = this.getDimensions(options);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    const categories = data[0].data.map((p) => p.label || '');
    const maxValue = Math.max(...data.flatMap((s) => s.data.map((p) => p.value || 0)), 1);

    // Draw grid circles
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw category lines (rotated 90 degrees)
    categories.forEach((_, i) => {
      const angle = (i * 2 * Math.PI) / categories.length + Math.PI / 2; // Start from right
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw data
    data.forEach((series, seriesIndex) => {
      const color = series.color || colors[seriesIndex % colors.length];
      ctx.beginPath();
      series.data.forEach((point, i) => {
        const angle = (i * 2 * Math.PI) / categories.length + Math.PI / 2; // Start from right
        const value = point.value || 0;
        const r = (radius * value) / maxValue;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fillStyle = this.colorWithOpacity(color, 0.2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw category labels
    categories.forEach((category, i) => {
      const angle = (i * 2 * Math.PI) / categories.length + Math.PI / 2; // Start from right
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);
      ctx.fillStyle = this.getTextColor(options);
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(category, x, y);
    });
  }
}
