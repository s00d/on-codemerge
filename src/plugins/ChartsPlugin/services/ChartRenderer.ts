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
import type { BaseChartRenderer } from '../renderers/BaseChartRenderer';
import { canvas, renderDetached } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';

export class ChartRenderer {
  private readonly renderers: Map<ChartType, BaseChartRenderer>;

  constructor(editor: EditorAPI) {
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
    const { el } = renderDetached(canvas());
    const canvasEl = el as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1;

    canvasEl.width = options.width * dpr;
    canvasEl.height = options.height * dpr;
    canvasEl.style.width = `${options.width}px`;
    canvasEl.style.height = `${options.height}px`;

    const ctx = canvasEl.getContext('2d');
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
        // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
        type === 'pie' || type === 'doughnut' ? normalizedData[0]?.data || [] : normalizedData;

      renderer.render(ctx, chartData, options);
    }

    // Convert canvas to Data URL and create an image
    const img = new Image();
    img.className = 'svg-chart';
    img.src = canvasEl.toDataURL('image/png');
    img.width = options.width;
    img.height = options.height;

    return img;
  }
}
