import type { ChartMenu } from './ChartMenu';
import { editIcon, deleteIcon, exportIcon } from '../../../icons';
import type { ChartType } from '../types';
import { downloadUrl } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import { pathFromEl, removeAtomAt } from '../../../utils/atomPath';

export class ChartContextMenu {
  private activeChart: HTMLElement | null = null;
  private readonly editor: EditorAPI;

  constructor(
    editor: EditorAPI,
    private readonly chartMenu: ChartMenu
  ) {
    this.editor = editor;
  }

  show(chart: HTMLElement, x: number, y: number): void {
    this.activeChart = chart;
    const shell = chart.closest<HTMLElement>('[data-ocm-atom="1"]') ?? chart;
    const t = (k: string) => this.editor.t(k) || k;
    this.editor.ui.menu.open(
      [
        {
          label: t('common.edit'),
          icon: editIcon,
          onClick: () => {
            if (!this.activeChart) {
              return;
            }
            const type = this.activeChart.dataset.chartType as ChartType;
            if (type && this.activeChart.dataset.chartData) {
              this.chartMenu.edit(this.activeChart);
            }
          },
        },
        {
          label: t('charts.exportPng'),
          icon: exportIcon,
          onClick: () => {
            if (!this.activeChart) {
              return;
            }
            const img = this.activeChart.querySelector('img.svg-chart') as HTMLImageElement | null;
            if (img?.src) {
              downloadUrl(img.src, 'chart.png');
              return;
            }
            const canvas = this.activeChart.querySelector('canvas');
            if (canvas) {
              downloadUrl(canvas.toDataURL('image/png'), 'chart.png');
            }
          },
        },
        { type: 'divider' },
        {
          label: t('common.delete'),
          icon: deleteIcon,
          variant: 'danger',
          onClick: () => {
            removeAtomAt(pathFromEl(shell) ?? shell, (cmd) => this.editor.run(cmd as never));
          },
        },
      ],
      x,
      y
    );
  }

  destroy(): void {
    this.activeChart = null;
    this.editor.ui.menu.hide();
  }
}
