import type { ChartToolbarOptions } from './types';

/**
 * Charts workspace toolbar — empty by default.
 * Chart type / options live in the studio; undo/redo from HistoryChromePlugin.
 * Pass a custom `toolbar` to ChartsPlugin / createDefaultPlugins to add bar actions.
 */
export function defaultChartToolbar(): ChartToolbarOptions {
  return { menus: [], items: [] };
}
