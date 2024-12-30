import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class RadarChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const { centerX, centerY, radius } = this.getRadarDimensions(options);
    const maxValue = Math.max(
      ...data.flatMap((series) => series.data.map((point) => point.value || 0))
    );

    this.drawRadarGrid(ctx, maxValue, centerX, centerY, radius);

    // Draw data polygons from back to front
    [...data].reverse().forEach((series, index) => {
      const color = series.color || this.colors[index % this.colors.length];
      this.drawDataPolygon(ctx, series, maxValue, centerX, centerY, radius, color);
    });

    this.drawAxisLabels(
      ctx,
      data[0].data.map((p) => p.label),
      centerX,
      centerY,
      radius
    );
    this.drawLegend(ctx, data, options);
  }

  private getRadarDimensions(options: ChartOptions) {
    const centerX = options.width / 2;
    const centerY = options.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    return { centerX, centerY, radius };
  }

  private drawRadarGrid(
    ctx: CanvasRenderingContext2D,
    maxValue: number,
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    const axisCount = 8;
    const step = maxValue / axisCount;

    // Draw circular grid lines
    for (let i = 1; i <= axisCount; i++) {
      const r = (radius * i) / axisCount;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();

      // Draw value labels
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(step * i).toString(), centerX - r - 5, centerY);
    }

    // Draw axis lines
    const angleStep = (Math.PI * 2) / 6;
    for (let i = 0; i < 6; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();
    }
  }

  private drawDataPolygon(
    ctx: CanvasRenderingContext2D,
    series: ChartSeries,
    maxValue: number,
    centerX: number,
    centerY: number,
    radius: number,
    color: string
  ): void {
    const points = series.data;
    const angleStep = (Math.PI * 2) / points.length;

    // Draw filled area
    ctx.beginPath();
    points.forEach((point, i) => {
      const value = point.value || 0;
      const angle = i * angleStep - Math.PI / 2;
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

    // Draw outline
    ctx.beginPath();
    points.forEach((point, i) => {
      const value = point.value || 0;
      const angle = i * angleStep - Math.PI / 2;
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
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    points.forEach((point, i) => {
      const value = point.value || 0;
      const angle = i * angleStep - Math.PI / 2;
      const r = (radius * value) / maxValue;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawAxisLabels(
    ctx: CanvasRenderingContext2D,
    labels: string[],
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    const angleStep = (Math.PI * 2) / labels.length;

    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter, system-ui, sans-serif';

    labels.forEach((label, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    });
  }
}
