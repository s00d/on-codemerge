import { downloadUrl } from '@codemerge/sdk';
import type { ChartOptions } from '../types/ChartOptions';
import type { ChartAttrs } from '../io/adapters';

/** Shared options builder (studio / widget / publish). */
export function optionsFromAttrs(
  attrs: Pick<
    ChartAttrs,
    | 'title'
    | 'width'
    | 'height'
    | 'showLegend'
    | 'showGrid'
    | 'mode'
    | 'orientation'
    | 'xAxisLabel'
    | 'yAxisLabel'
  >
): ChartOptions {
  return {
    width: attrs.width,
    height: attrs.height,
    title: attrs.title,
    xAxis: { title: attrs.xAxisLabel },
    yAxis: { title: attrs.yAxisLabel },
    legend: { show: attrs.showLegend },
    grid: { show: attrs.showGrid },
    mode: attrs.mode,
    orientation: attrs.orientation,
  };
}

export function downloadPngFromHost(host: HTMLElement, filename = 'chart.png'): void {
  const img = host.querySelector('img.svg-chart');
  if (img instanceof HTMLImageElement && img.src) {
    downloadUrl(img.src, filename);
    return;
  }
  const canvasEl = host.querySelector('canvas');
  if (canvasEl instanceof HTMLCanvasElement) {
    downloadUrl(canvasEl.toDataURL('image/png'), filename);
  }
}
