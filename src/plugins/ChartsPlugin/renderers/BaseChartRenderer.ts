import type { ChartOptions } from '../types';
import { CHART_COLORS, colorWithOpacity } from '../utils/colors';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export abstract class BaseChartRenderer {
  protected editor: HTMLEditor;
  protected colors = CHART_COLORS;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  abstract render(ctx: CanvasRenderingContext2D, data: any[], options: ChartOptions): void;

  protected colorWithOpacity(color: string | undefined, opacity: number): string {
    return colorWithOpacity(color, opacity);
  }

  protected getDimensions(options: ChartOptions) {
    const padding = Math.max(40, options.padding || 40);
    const width = Math.max(0, options.width - padding * 2);
    const height = Math.max(0, options.height - padding * 2);
    return { padding, width, height };
  }

  protected getCircleDimensions(options: ChartOptions) {
    const centerX = options.width / 2;
    const centerY = options.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    return { centerX, centerY, radius };
  }

  protected drawNoDataMessage(ctx: CanvasRenderingContext2D, options: ChartOptions): void {
    ctx.save();
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillText(
      this.editor.t('No valid data points to display'),
      options.width / 2,
      options.height / 2
    );
    ctx.restore();
  }

  protected drawGrid(
    ctx: CanvasRenderingContext2D,
    options: ChartOptions,
    maxValue: number,
    showXAxis: boolean = true,
    xLabels?: string[],
    chartType?: string
  ): void {
    if (options.grid && options.grid.show === false) {
      return;
    }

    const { padding, width, height } = this.getDimensions(options);

    ctx.save();
    ctx.strokeStyle = options.grid?.color || this.getGridColor(options);
    ctx.lineWidth = options.grid?.width || 1;
    ctx.setLineDash(
      options.grid?.style === 'dashed' ? [5, 5] : options.grid?.style === 'dotted' ? [2, 2] : []
    );
    ctx.globalAlpha = options.grid?.opacity || 0.3;
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, system-ui, sans-serif';

    // Draw Y-axis grid lines and labels
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height * i) / 5;
      const value = Math.round(maxValue * (1 - i / 5));

      // Draw grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(options.width - padding, y);
      ctx.stroke();

      // Draw Y-axis label
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), padding - 10, y);
    }

    // Draw X-axis if needed
    if (showXAxis) {
      // Draw X-axis line
      ctx.beginPath();
      ctx.moveTo(padding, options.height - padding);
      ctx.lineTo(options.width - padding, options.height - padding);
      ctx.stroke();

      // Draw X-axis labels if provided
      if (xLabels && xLabels.length > 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = this.getTextColor(options);
        ctx.font = '11px Inter, system-ui, sans-serif';

        xLabels.forEach((label, i) => {
          let x: number;

          if (chartType === 'line' || chartType === 'area') {
            // Для line и area графиков - позиционирование как у точек
            x = padding + (width / Math.max(1, xLabels.length - 1)) * i;
          } else {
            // Для bar и других графиков - позиционирование по центру слотов
            const barSpacing = width / xLabels.length;
            x = padding + barSpacing * i + barSpacing / 2;
          }

          ctx.save();
          ctx.translate(x, options.height - padding + 8);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        });
      }
    }

    ctx.restore();
  }

  protected drawLegend(ctx: CanvasRenderingContext2D, data: any[], options: ChartOptions): void {
    if (options.legend && options.legend.show === false) {
      return;
    }

    const { padding } = this.getDimensions(options);
    const legendY = padding / 2;
    let legendX = padding;

    data.forEach((series, i) => {
      const name = series.name || this.editor.t('Series') + ` ${i + 1}`;
      const color = series.color || this.getColors(options)[i % this.getColors(options).length];

      // Draw color indicator
      ctx.beginPath();
      ctx.arc(legendX, legendY, 6, 0, Math.PI * 2);
      ctx.fillStyle = this.colorWithOpacity(color, 0.3);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw series name
      ctx.fillStyle = this.getTextColor(options);
      ctx.textAlign = 'left';
      ctx.fillText(name, legendX + 15, legendY + 4);

      legendX += ctx.measureText(name).width + 40;
    });
  }

  protected getColors(options: ChartOptions): string[] {
    if (options.colors && options.colors.length > 0) {
      return options.colors;
    }
    if (options.theme && options.theme.colors && options.theme.colors.primary) {
      return options.theme.colors.primary;
    }
    return this.colors;
  }

  protected getTextColor(options: ChartOptions): string {
    if (options.theme && options.theme.colors && options.theme.colors.text) {
      return options.theme.colors.text;
    }
    return '#222';
  }

  protected getBackgroundColor(options: ChartOptions): string {
    if (options.theme && options.theme.colors && options.theme.colors.background) {
      return options.theme.colors.background;
    }
    return '#fff';
  }

  protected getGridColor(options: ChartOptions): string {
    if (options.theme && options.theme.colors && options.theme.colors.grid) {
      return options.theme.colors.grid;
    }
    return '#e5e7eb';
  }

  protected drawTitle(ctx: CanvasRenderingContext2D, options: ChartOptions): void {
    if (!options.title) return;

    ctx.save();
    ctx.fillStyle = this.getTextColor(options);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText(options.title, options.width / 2, 20);
    ctx.restore();
  }

  protected drawAxisLabels(ctx: CanvasRenderingContext2D, options: ChartOptions): void {
    const { padding } = this.getDimensions(options);

    ctx.save();
    ctx.fillStyle = this.getTextColor(options);
    ctx.font = '12px Inter, system-ui, sans-serif';

    // X-axis label
    if (options.xAxis?.title) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(options.xAxis.title, options.width / 2, options.height - padding + 30);
    }

    // Y-axis label
    if (options.yAxis?.title) {
      ctx.save();
      ctx.translate(padding - 30, options.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(options.yAxis.title, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  protected drawBackground(ctx: CanvasRenderingContext2D, options: ChartOptions): void {
    ctx.save();
    ctx.fillStyle = this.getBackgroundColor(options);
    ctx.fillRect(0, 0, options.width, options.height);
    ctx.restore();
  }
}
