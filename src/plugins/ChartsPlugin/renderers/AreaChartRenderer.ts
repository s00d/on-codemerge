import type { ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class AreaChartRenderer extends BaseChartRenderer {
  public render(ctx: CanvasRenderingContext2D, data: ChartSeries[], options: ChartOptions): void {
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    const isMulti = Array.isArray(data) && 'data' in data[0];
    const seriesArr: ChartSeries[] = isMulti
      ? (data as ChartSeries[])
      : [{ name: '', data: data as any }];
    const categories = seriesArr[0].data.map((p) => p.label || '');
    const colors = this.getColors(options);
    const mode = options.mode || 'default';
    const orientation = options.orientation || 'vertical';

    // Вычисление максимального значения для разных режимов
    let maxValue = 1;
    if (mode === 'stacked') {
      maxValue = Math.max(
        ...categories.map((_, i) => seriesArr.reduce((sum, s) => sum + (s.data[i]?.value || 0), 0))
      );
    } else {
      maxValue = Math.max(...seriesArr.flatMap((s) => s.data.map((p) => p.value || 0)), 1);
    }

    // Draw background
    this.drawBackground(ctx, options);
    this.drawTitle(ctx, options);
    this.drawGrid(ctx, options, maxValue, true, categories, 'area');

    if (orientation === 'vertical') {
      if (mode === 'stacked') {
        this.drawStackedArea(ctx, seriesArr, options, maxValue, colors);
      } else {
        this.drawNormalArea(ctx, seriesArr, options, maxValue, colors);
      }
    } else {
      if (mode === 'stacked') {
        this.drawHorizontalStackedArea(ctx, seriesArr, options, maxValue, colors);
      } else {
        this.drawHorizontalArea(ctx, seriesArr, options, maxValue, colors);
      }
    }

    this.drawAxisLabels(ctx, options);
    this.drawLegend(ctx, seriesArr, options);
  }

  // Обычная area (несколько серий)
  private drawNormalArea(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const scale = height / (maxValue * 1.1);
    [...seriesArr].reverse().forEach((series, index) => {
      const color = series.color || colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(padding, options.height - padding);
      series.data.forEach((point, i) => {
        const x = padding + (width / (series.data.length - 1)) * i;
        const y = options.height - padding - (point.value || 0) * scale;
        if (i === 0) ctx.moveTo(x, options.height - padding);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(options.width - padding, options.height - padding);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, padding, 0, options.height - padding);
      gradient.addColorStop(0, this.colorWithOpacity(color, 0.3));
      gradient.addColorStop(1, this.colorWithOpacity(color, 0.05));
      ctx.fillStyle = gradient;
      ctx.fill();
      this.drawLine(ctx, series, options, scale, color);
      this.drawPoints(ctx, series, options, scale, color);
    });
  }

  // Stacked area
  private drawStackedArea(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const pointCount = seriesArr[0].data.length;
    const scale = height / (maxValue * 1.1);
    // Массив накопленных значений
    const stack: number[] = new Array(pointCount).fill(0);
    [...seriesArr].reverse().forEach((series, index) => {
      const color = series.color || colors[index % colors.length];
      ctx.beginPath();
      for (let i = 0; i < pointCount; i++) {
        const x = padding + (width / (pointCount - 1)) * i;
        stack[i] += series.data[i]?.value || 0;
        const y = options.height - padding - stack[i] * scale;
        if (i === 0) ctx.moveTo(x, options.height - padding);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(options.width - padding, options.height - padding);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, padding, 0, options.height - padding);
      gradient.addColorStop(0, this.colorWithOpacity(color, 0.3));
      gradient.addColorStop(1, this.colorWithOpacity(color, 0.05));
      ctx.fillStyle = gradient;
      ctx.fill();
      // Линия по верхнему краю
      ctx.beginPath();
      for (let i = 0; i < pointCount; i++) {
        const x = padding + (width / (pointCount - 1)) * i;
        const y = options.height - padding - stack[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // Горизонтальная area
  private drawHorizontalArea(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const scale = width / (maxValue * 1.1);
    [...seriesArr].reverse().forEach((series, index) => {
      const color = series.color || colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(padding, height - padding);
      series.data.forEach((point, i) => {
        const y = padding + (height / (series.data.length - 1)) * i;
        const x = padding + (point.value || 0) * scale;
        if (i === 0) ctx.moveTo(padding, y);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(padding, height - padding);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(padding, 0, width - padding, 0);
      gradient.addColorStop(0, this.colorWithOpacity(color, 0.3));
      gradient.addColorStop(1, this.colorWithOpacity(color, 0.05));
      ctx.fillStyle = gradient;
      ctx.fill();
      // Линия
      ctx.beginPath();
      series.data.forEach((point, i) => {
        const y = padding + (height / (series.data.length - 1)) * i;
        const x = padding + (point.value || 0) * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // Горизонтальная stacked area
  private drawHorizontalStackedArea(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const pointCount = seriesArr[0].data.length;
    const scale = width / (maxValue * 1.1);
    const stack: number[] = new Array(pointCount).fill(0);
    [...seriesArr].reverse().forEach((series, index) => {
      const color = series.color || colors[index % colors.length];
      ctx.beginPath();
      for (let i = 0; i < pointCount; i++) {
        const y = padding + (height / (pointCount - 1)) * i;
        stack[i] += series.data[i]?.value || 0;
        const x = padding + stack[i] * scale;
        if (i === 0) ctx.moveTo(padding, y);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(padding, height - padding);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(padding, 0, width - padding, 0);
      gradient.addColorStop(0, this.colorWithOpacity(color, 0.3));
      gradient.addColorStop(1, this.colorWithOpacity(color, 0.05));
      ctx.fillStyle = gradient;
      ctx.fill();
      // Линия
      ctx.beginPath();
      for (let i = 0; i < pointCount; i++) {
        const y = padding + (height / (pointCount - 1)) * i;
        const x = padding + stack[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
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
