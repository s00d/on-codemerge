import type { ChartType, ChartPoint, ChartSeries, ChartOptions } from '../types';
import { BarChartRenderer } from '../renderers/BarChartRenderer';
import { LineChartRenderer } from '../renderers/LineChartRenderer';
import { PieChartRenderer } from '../renderers/PieChartRenderer';
import { DoughnutChartRenderer } from '../renderers/DoughnutChartRenderer';
import { AreaChartRenderer } from '../renderers/AreaChartRenderer';
import { RadarChartRenderer } from '../renderers/RadarChartRenderer';
import { ScatterChartRenderer } from '../renderers/ScatterChartRenderer';
import { BubbleChartRenderer } from '../renderers/BubbleChartRenderer';
import { normalizeChartData } from '../utils/validation';
import type { BaseChartRenderer } from '../renderers/BaseChartRenderer.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createCanvas } from '../../../utils/helpers.ts';

export class ChartRenderer {
  private renderers: Map<ChartType, BaseChartRenderer>;

  constructor(editor: HTMLEditor) {
    this.renderers = new Map<ChartType, BaseChartRenderer>([
      ['bar', new BarChartRenderer(editor)],
      ['line', new LineChartRenderer(editor)],
      ['pie', new PieChartRenderer(editor)],
      ['doughnut', new DoughnutChartRenderer(editor)],
      ['area', new AreaChartRenderer(editor)],
      ['radar', new RadarChartRenderer(editor)],
      ['scatter', new ScatterChartRenderer(editor)],
      ['bubble', new BubbleChartRenderer(editor)],
    ]);
  }

  public createChart(
    type: ChartType,
    data: ChartPoint[] | ChartSeries[],
    options: ChartOptions
  ): HTMLImageElement {
    const canvas = createCanvas();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = options.width * dpr;
    canvas.height = options.height * dpr;
    canvas.style.width = `${options.width}px`;
    canvas.style.height = `${options.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Scale context for retina displays
    ctx.scale(dpr, dpr);

    // Set default styles
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const renderer = this.renderers.get(type);
    if (renderer) {
      // Normalize data to multi-series format
      const normalizedData = normalizeChartData(data);

      // For pie/doughnut charts, use only first series
      const chartData =
        type === 'pie' || type === 'doughnut' ? normalizedData[0]?.data || [] : normalizedData;

      renderer.render(ctx, chartData, options);
    }

    // Convert canvas to Data URL and create an image
    const img = new Image();
    img.className = 'svg-chart'
    img.src = canvas.toDataURL('image/png');
    img.width = options.width;
    img.height = options.height;

    return img;
  }
}
