import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

import 'chartist/dist/index.css';
import { DiagramManager } from "./DiagramManager";
import { diagram } from "../../../src/icons";

export class DataVisualizationButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private chartMap: Map<string, DiagramManager> = new Map();
  private button: HTMLDivElement | null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.button = core.toolbar.addButtonIcon('Chart', diagram, this.createChartEvent.bind(this));
    core.subscribeToContentChange(() => {
      this.reloadCharts(core)
    });

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Chart');
  }

  public reloadCharts(core: EditorCoreInterface): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const charts = editor.querySelectorAll('div[id^="block-chart-"]');
    charts.forEach((chartDiv) => {
      const chartId = chartDiv.id.replace('block-', '');

      if (!this.chartMap.has(chartId)) {
        const chartType = this.retrieveChartType(chartDiv);
        const { labels, dataset } = this.retrieveChartData(chartDiv);

        const chartManager = new DiagramManager(this.core!, labels, dataset);
        chartManager.show(chartId, chartType);
        this.chartMap.set(chartId, chartManager);
      }
    });
  }

  private retrieveChartType(chartDiv: Element): string {
    // Retrieve the chart type from the data attribute
    return chartDiv.getAttribute('data-chart-type') || 'line'; // Default to 'line' if not found
  }

  private retrieveChartData(chartDiv: Element): { labels: string[], dataset: number[][] } {
    // Retrieve and parse the chart data from the data attributes
    const labels = JSON.parse(chartDiv.getAttribute('data-chart-labels') || '[]');
    const dataset = JSON.parse(chartDiv.getAttribute('data-chart-dataset') || '[[]]');

    return { labels, dataset };
  }

  private createChartEvent() {
      const id = 'chart-' + Math.random().toString(36).substring(2, 11);
      const char = new DiagramManager(this.core!)
      char.create((type) => {
        this.chartMap.set(id, char)
        char.show(id, type)
        return;
      }, () => {
        // char.destroy();
        return;
      })
  }

  destroy(): void {
    // Удаление всех экземпляров Chart и очистка ссылок
    this.chartMap.forEach((chart) => {
      chart.destroy();
    });
    this.chartMap.clear();

    this.button?.removeEventListener('click', this.createChartEvent);
    this.button = null;
  }
}

export default DataVisualizationButton;
