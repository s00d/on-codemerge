import { exportIcon } from '@ocm/wysiwyg/icons';
import type { ChartToolbarItem, ChartToolbarOptions } from './types';

export type DefaultChartToolbarOptions = {
  t?: (key: string) => string;
};

/**
 * Charts workspace toolbar — export beside undo/redo.
 * Type / data / settings live in the studio panes.
 */
export function defaultChartToolbar(opts: DefaultChartToolbarOptions = {}): ChartToolbarOptions {
  const items: ChartToolbarItem[] = [
    {
      id: 'chart-export-png',
      icon: exportIcon,
      title: () => opts.t?.('charts.exportAsPng') || 'Export as PNG',
      group: 'history',
      order: 10,
      run: ({ workspace }) => {
        workspace?.exportPng();
      },
    },
  ];
  return { menus: [], items };
}
