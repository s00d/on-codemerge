import './public.scss';
import './style.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ChartMenu } from './components/ChartMenu';
import { ChartContextMenu } from './components/ChartContextMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { CHART_TYPE_CONFIGS } from './constants/chartTypes';
import { Resizer } from '../../utils/Resizer.ts';
import { createContainer, createLineBreak } from '../../utils/helpers.ts';
import type { ChartSeries, ChartType } from './types';

export class ChartsPlugin implements Plugin {
  name = 'charts';
  hotkeys = [{ keys: 'Ctrl+Alt+G', description: 'Insert chart', command: 'charts', icon: '📊' }];
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
    const toolbar = this.editor?.getToolbar();
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
          onResizeStart: () => this.editor?.disableObserver(),
          onResize: (width, height) => {
            console.log(`Resized to ${width}x${height}`);
            const type = chart.getAttribute('data-chart-type') as ChartType;
            const dataStr = chart.getAttribute('data-chart-data') ?? '';
            const data = JSON.parse(dataStr) as ChartSeries[];
            this.menu?.redrawChart(chart, type, data, { width, height });
          },
          onResizeEnd: () => this.editor?.enableObserver(),
        });
      }
    });

    // Handle context menu
    container.addEventListener('contextmenu', (e) => {
      const chart = (e.target as Element).closest('.chart-container');
      if (chart instanceof HTMLElement) {
        e.preventDefault();
        const mouseX = (e as MouseEvent).clientX;
        const mouseY = (e as MouseEvent).clientY;

        console.log('Mouse coordinates:', mouseX, mouseY);

        this.contextMenu?.show(chart, mouseX, mouseY);
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
    const selection = this.editor.getTextFormatter()?.getSelection();
    let range: Range;

    const createRangeAtEnd = () => {
      const r = document.createRange();
      r.selectNodeContents(container);
      r.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(r);
      return r;
    };

    if (selection && selection.rangeCount > 0) {
      const candidate = selection.getRangeAt(0);
      const isInsideEditor =
        container.contains(candidate.startContainer) && container.contains(candidate.endContainer);
      range = isInsideEditor ? candidate : createRangeAtEnd();
    } else {
      range = createRangeAtEnd();
    }

    // Show chart menu
    this.menu?.show((chartElement) => {
      if (!this.editor) return;

      // Insert chart and line break
      const wrapper = createContainer('chart-wrapper my-4');
      wrapper.appendChild(chartElement);

      wrapper.appendChild(createLineBreak());

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

  public destroy(): void {
    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    if (this.currentResizer) {
      this.currentResizer.destroy();
      this.currentResizer = null;
    }

    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
      this.toolbarButton = null;
    }

    this.editor?.off('charts');

    this.editor = null;
  }
}
