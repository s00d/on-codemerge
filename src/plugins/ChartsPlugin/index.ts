import './public.scss';
import './style.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ChartMenu } from './components/ChartMenu';
import { ChartContextMenu } from './components/ChartContextMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { CHART_TYPE_CONFIGS } from './constants/chartTypes';
import { Resizer } from '../../utils/Resizer.ts';

export class ChartsPlugin implements Plugin {
  name = 'charts';
  private editor: HTMLEditor | null = null;
  private menu: ChartMenu | null = null;
  private contextMenu: ChartContextMenu | null = null;
  private currentResizer: Resizer | null = null;
  private toolbarButton: HTMLElement | null = null; // Сохраняем ссылку на кнопку тулбара

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.menu = new ChartMenu(editor);
    this.contextMenu = new ChartContextMenu(editor, this.menu);
    this.addToolbarButton();
    this.setupChartEvents();
    this.editor.on('charts', () => {
      this.insertChart();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: CHART_TYPE_CONFIGS.bar.icon,
      title: this.editor?.t('Insert Chart'),
      onClick: () => this.insertChart(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private setupChartEvents(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    // Handle chart clicks for resizing
    container.addEventListener('click', (e) => {
      const chart = (e.target as Element).closest('.chart-container');
      if (chart instanceof HTMLElement) {
        if (this.currentResizer) {
          this.currentResizer.destroy();
          this.currentResizer = null;
        }

        // Создаем новый Resizer для блока
        this.currentResizer = new Resizer(chart, {
          handleSize: 10,
          handleColor: 'blue',
          onResizeStart: () => console.log('Resize started'),
          onResize: (width, height) => console.log(`Resized to ${width}x${height}`),
          onResizeEnd: () => console.log('Resize ended'),
        });
      }
    });

    // Handle context menu
    container.addEventListener('contextmenu', (e) => {
      const chart = (e.target as Element).closest('.chart-container');
      if (chart instanceof HTMLElement) {
        e.preventDefault();
        this.contextMenu?.show(chart, e.clientX, e.clientY);
      }
    });

    // Handle chart resize events
    container.addEventListener('chartresize', (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const chart = (e.target as Element).closest('.chart-container');
      if (chart instanceof HTMLElement) {
        this.menu?.redrawChart(chart, detail.type, detail.data, {
          width: detail.width,
          height: detail.height,
        });
      }
    });
  }

  private insertChart(): void {
    if (!this.editor) return;

    // Create a new range at the end if no selection exists
    const container = this.editor.getContainer();
    const selection = window.getSelection();
    let range: Range;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(container);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    // Show chart menu
    this.menu?.show((chartElement) => {
      if (!this.editor) return;

      // Insert chart and line break
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-wrapper my-4';
      wrapper.appendChild(chartElement);

      const br = document.createElement('br');
      wrapper.appendChild(br);

      // Insert at current selection
      range.deleteContents();
      range.insertNode(wrapper);

      // Move cursor after chart
      range.setStartAfter(wrapper);
      range.setEndAfter(wrapper);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  }

  /**
   * Уничтожение плагина
   */
  public destroy(): void {
    // Уничтожаем меню и контекстное меню
    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    // Уничтожаем текущий Resizer
    if (this.currentResizer) {
      this.currentResizer.destroy();
      this.currentResizer = null;
    }

    // Удаляем кнопку из тулбара
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
      this.toolbarButton = null;
    }

    // Очищаем ссылку на редактор
    this.editor = null;
  }
}