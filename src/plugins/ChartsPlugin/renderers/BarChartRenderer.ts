import type { ChartPoint, ChartSeries, ChartOptions } from '../types';
import { BaseChartRenderer } from './BaseChartRenderer';
import { validateChartData } from '../utils/validation';

export class BarChartRenderer extends BaseChartRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    data: ChartPoint[] | ChartSeries[],
    options: ChartOptions
  ): void {
    if (!validateChartData(data)) {
      this.drawNoDataMessage(ctx, options);
      return;
    }

    // Multi-series поддержка
    const isMulti = Array.isArray(data) && 'data' in data[0];
    const seriesArr: ChartSeries[] = isMulti
      ? (data as ChartSeries[])
      : [{ name: '', data: data as ChartPoint[] }];
    const categories = seriesArr[0].data.map((p) => p.label || '');
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
    this.drawGrid(ctx, options, maxValue, true, categories, 'bar');

    // Draw bars по режиму
    if (orientation === 'vertical') {
      if (mode === 'stacked') {
        this.drawStackedBars(ctx, seriesArr, options, maxValue, this.getColors(options));
      } else if (mode === 'grouped') {
        this.drawGroupedBars(ctx, seriesArr, options, maxValue, this.getColors(options));
      } else {
        this.drawSingleBars(ctx, seriesArr, options, maxValue, this.getColors(options));
      }
    } else {
      if (mode === 'stacked') {
        this.drawHorizontalStackedBars(ctx, seriesArr, options, maxValue, this.getColors(options));
      } else if (mode === 'grouped') {
        this.drawHorizontalGroupedBars(ctx, seriesArr, options, maxValue, this.getColors(options));
      } else {
        this.drawHorizontalBars(ctx, seriesArr, options, maxValue, this.getColors(options));
      }
    }

    this.drawAxisLabels(ctx, options);
    this.drawLegend(ctx, seriesArr, options);
  }

  // Обычные вертикальные bars (single series)
  private drawSingleBars(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const points = seriesArr[0].data;
    const barCount = points.length;
    const totalWidth = width;
    const barWidth = Math.max(20, totalWidth / Math.max(1, barCount) / 1.5);
    const barSpacing = totalWidth / barCount;
    const scale = height / maxValue;
    points.forEach((point, i) => {
      const value = point.value || 0;
      const x = padding + barSpacing * i + (barSpacing - barWidth) / 2;
      const barHeight = value * scale;
      const y = options.height - padding - barHeight;
      const color = point.color || colors[i % colors.length];
      // Тень
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(x + 2, y + 2, barWidth, barHeight);
      // Градиент
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.colorWithOpacity(color, 0.7));
      ctx.fillStyle = gradient;
      this.roundRect(ctx, x, y, barWidth, barHeight, 4);
      ctx.fill();
      // Значение
      ctx.fillStyle = this.getTextColor(options);
      ctx.textAlign = 'center';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(value.toString(), x + barWidth / 2, y - 8);
    });
  }

  // Stacked bars
  private drawStackedBars(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const barCount = seriesArr[0].data.length;
    const barSpacing = width / barCount;
    const barWidth = Math.max(20, barSpacing / 1.5);
    for (let i = 0; i < barCount; i++) {
      let y = options.height - padding;
      for (let s = 0; s < seriesArr.length; s++) {
        const value = seriesArr[s].data[i]?.value || 0;
        const barHeight = (value * height) / maxValue;
        y -= barHeight;
        const x = padding + barSpacing * i + (barSpacing - barWidth) / 2;
        const color = seriesArr[s].color || colors[s % colors.length];
        ctx.fillStyle = color;
        this.roundRect(ctx, x, y, barWidth, barHeight, 4);
        ctx.fill();
      }
    }
  }

  // Grouped bars
  private drawGroupedBars(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const barCount = seriesArr[0].data.length;
    const groupCount = seriesArr.length;
    const barSpacing = width / barCount;
    const groupWidth = Math.max(20, barSpacing / 1.2);
    const singleBarWidth = groupWidth / groupCount;
    const scale = height / maxValue;
    for (let i = 0; i < barCount; i++) {
      for (let s = 0; s < groupCount; s++) {
        const value = seriesArr[s].data[i]?.value || 0;
        const barHeight = value * scale;
        const x = padding + barSpacing * i + (barSpacing - groupWidth) / 2 + s * singleBarWidth;
        const y = options.height - padding - barHeight;
        const color = seriesArr[s].color || colors[s % colors.length];
        ctx.fillStyle = color;
        this.roundRect(ctx, x, y, singleBarWidth, barHeight, 4);
        ctx.fill();
      }
    }
  }

  // Горизонтальные обычные bars
  private drawHorizontalBars(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const points = seriesArr[0].data;
    const barCount = points.length;
    const totalHeight = height;
    const barHeight = Math.max(20, totalHeight / Math.max(1, barCount) / 1.5);
    const barSpacing = totalHeight / barCount;
    const scale = width / maxValue;
    points.forEach((point, i) => {
      const value = point.value || 0;
      const y = padding + barSpacing * i + (barSpacing - barHeight) / 2;
      const barWidth = value * scale;
      const x = padding;
      const color = point.color || colors[i % colors.length];
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(x + 2, y + 2, barWidth, barHeight);
      const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.colorWithOpacity(color, 0.7));
      ctx.fillStyle = gradient;
      this.roundRect(ctx, x, y, barWidth, barHeight, 4);
      ctx.fill();
      ctx.fillStyle = this.getTextColor(options);
      ctx.textAlign = 'left';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(value.toString(), x + barWidth + 8, y + barHeight / 2);
    });
  }

  // Горизонтальные stacked bars
  private drawHorizontalStackedBars(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const barCount = seriesArr[0].data.length;
    const barSpacing = height / barCount;
    const barHeight = Math.max(20, barSpacing / 1.5);
    for (let i = 0; i < barCount; i++) {
      let x = padding;
      for (let s = 0; s < seriesArr.length; s++) {
        const value = seriesArr[s].data[i]?.value || 0;
        const barWidth = (value * width) / maxValue;
        const y = padding + barSpacing * i + (barSpacing - barHeight) / 2;
        const color = seriesArr[s].color || colors[s % colors.length];
        ctx.fillStyle = color;
        this.roundRect(ctx, x, y, barWidth, barHeight, 4);
        ctx.fill();
        x += barWidth;
      }
    }
  }

  // Горизонтальные grouped bars
  private drawHorizontalGroupedBars(
    ctx: CanvasRenderingContext2D,
    seriesArr: ChartSeries[],
    options: ChartOptions,
    maxValue: number,
    colors: string[]
  ) {
    const { padding, width, height } = this.getDimensions(options);
    const barCount = seriesArr[0].data.length;
    const groupCount = seriesArr.length;
    const barSpacing = height / barCount;
    const groupHeight = Math.max(20, barSpacing / 1.2);
    const singleBarHeight = groupHeight / groupCount;
    const scale = width / maxValue;
    for (let i = 0; i < barCount; i++) {
      for (let s = 0; s < groupCount; s++) {
        const value = seriesArr[s].data[i]?.value || 0;
        const barWidth = value * scale;
        const y = padding + barSpacing * i + (barSpacing - groupHeight) / 2 + s * singleBarHeight;
        const x = padding;
        const color = seriesArr[s].color || colors[s % colors.length];
        ctx.fillStyle = color;
        this.roundRect(ctx, x, y, barWidth, singleBarHeight, 4);
        ctx.fill();
      }
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
