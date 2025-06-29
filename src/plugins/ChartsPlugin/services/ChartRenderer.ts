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
  ): HTMLCanvasElement {
    const canvas = createCanvas();
    canvas.className = 'chart-canvas';
    const dpr = window.devicePixelRatio || 1;
    canvas.width = options.width * dpr;
    canvas.height = options.height * dpr;
    canvas.style.width = `${options.width}px`;
    canvas.style.height = `${options.height}px`;
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const renderer = this.renderers.get(type);
    if (renderer) {
      const normalizedData = normalizeChartData(data);
      const chartData =
        type === 'pie' || type === 'doughnut' ? normalizedData[0]?.data || [] : normalizedData;
      renderer.render(ctx, chartData, options);
    }
    return canvas;
  }
}
