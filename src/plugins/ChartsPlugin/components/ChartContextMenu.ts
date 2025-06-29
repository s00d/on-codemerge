import type { ChartMenu } from './ChartMenu';
import { editIcon, deleteIcon, exportIcon } from '../../../icons';
import type { ChartType } from '../types';
import { ContextMenu } from '../../../core/ui/ContextMenu.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class ChartContextMenu {
  private contextMenu: ContextMenu;
  private activeChart: HTMLElement | null = null;

  constructor(
    editor: HTMLEditor,
    private chartMenu: ChartMenu
  ) {
    // Создаем контекстное меню с кнопками
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          label: editor.t('Edit'),
          icon: editIcon,
          action: 'edit',
          onClick: () => this.handleEdit(),
        },
        {
          label: editor.t('Export PNG'),
          icon: exportIcon,
          action: 'export',
          onClick: () => this.handleExport(),
        },
        {
          label: editor.t('Delete'),
          icon: deleteIcon,
          action: 'delete',
          className: 'text-red-600',
          onClick: () => this.handleDelete(),
        },
      ],
      { orientation: 'vertical' } // Ориентация меню (вертикальная)
    );
  }

  private handleEdit(): void {
    if (!this.activeChart) return;

    const type = this.activeChart.getAttribute('data-chart-type') as ChartType;
    const dataStr = this.activeChart.getAttribute('data-chart-data');

    if (type && dataStr) {
      try {
        this.chartMenu.edit(this.activeChart);
      } catch (e) {
        console.error('Failed to parse chart data:', e);
      }
    }
  }

  private handleDelete(): void {
    if (this.activeChart) {
      this.activeChart.remove();
    }
  }

  private handleExport(): void {
    if (!this.activeChart) return;
    // Пробуем найти img/svg-chart или canvas внутри activeChart
    const img = this.activeChart.querySelector('img.svg-chart') as HTMLImageElement;
    if (img && img.src) {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = 'chart.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const canvas = this.activeChart.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'chart.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  public show(chart: HTMLElement, x: number, y: number): void {
    this.activeChart = chart;
    this.contextMenu.show(chart, x, y); // Показываем контекстное меню
  }

  public hide(): void {
    this.contextMenu.hide(); // Скрываем контекстное меню
    this.activeChart = null;
  }

  public destroy(): void {
    // Если у ContextMenu есть метод destroy, вызываем его
    if (typeof this.contextMenu.destroy === 'function') {
      this.contextMenu.destroy();
    }

    // Очищаем ссылки
    this.contextMenu = null!;
    this.activeChart = null;
    this.chartMenu = null!;
  }
}
