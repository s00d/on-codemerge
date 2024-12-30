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
    xLabels?: string[]
  ): void {
    const { padding, width, height } = this.getDimensions(options);

    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
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

        xLabels.forEach((label, i) => {
          const x = padding + (width * i) / (xLabels.length - 1);

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
    const { padding } = this.getDimensions(options);
    const legendY = padding / 2;
    let legendX = padding;

    data.forEach((series, i) => {
      const name = series.name || this.editor.t('Series') + ` ${i + 1}`;
      const color = series.color || this.colors[i % this.colors.length];

      // Draw color indicator
      ctx.beginPath();
      ctx.arc(legendX, legendY, 6, 0, Math.PI * 2);
      ctx.fillStyle = this.colorWithOpacity(color, 0.3);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw series name
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.fillText(name, legendX + 15, legendY + 4);

      legendX += ctx.measureText(name).width + 40;
    });
  }
}
