import { BarChart, LineChart, PieChart } from 'chartist';
import type { EditorCoreInterface } from "../../../src/types";
import { Modal } from "../../../helpers/modal";
import {ResizableElement} from "../../../helpers/ResizableElement";

export class DiagramManager {
  private core: EditorCoreInterface;
  private div: HTMLDivElement | null = null;
  private chart: BarChart | LineChart | PieChart | null = null;
  private modal: Modal | null = null;
  private resizer: ResizableElement|null = null;

  constructor(core: EditorCoreInterface) {
    this.core = core;
    this.modal = new Modal(this.core, '600px');

  }

  show(charId: string, chartType: string, labels: string[], dataset: string[]) {
    // Создание элемента canvas для графика
    this.div = document.createElement('div');
    this.div.id = 'block-' + charId;
    this.div.contentEditable = 'false';
    this.div.setAttribute('data-chart-type', chartType);
    this.div.setAttribute('data-chart-labels', JSON.stringify(labels));
    this.div.setAttribute('data-chart-dataset', JSON.stringify(dataset));

    this.core.insertHTMLIntoEditor(this.div.outerHTML);

    this.resizer = new ResizableElement(this.div, this.core);


    const chartData = {
      labels: labels,
      series: [dataset.map(Number)] // Преобразование строк в числа
    };

    switch (chartType) {
      case 'line':
        this.chart = new LineChart('#' + this.div.id, chartData);
        break;
      case 'bar':
        this.chart = new BarChart('#' + this.div.id, chartData);
        break;
      case 'pie':
        const pieData = {
          labels: labels,
          series: dataset.map(Number) // Для круговой диаграммы формат данных отличается
        };

        this.chart = new PieChart('#' + this.div.id, pieData);
        break;
      default:
        throw new Error('BAD CHAR')
    }

    this.chart.on("created", (aaa) => {
      const svg = aaa.svg._node as SVGAElement
      this.div = svg.parentElement as HTMLDivElement
      this.resizer = new ResizableElement(this.div, this.core, () => {
        this.chart?.update();
      });

      console.log(svg)
      svg.id = charId;
      svg.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.openEditModal();
      }

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core?.setContent(editor.innerHTML)
    });


    this.core.saveCurrentSelection();
    this.core.moveCursorToStart();
  }

  public updateChart(newLabels: string[], newDataset: string[]): void {
    // Implementation of chart updating logic
    // Update 'this.chart' with new data
  }

  private openEditModal() {
    const isPieChart = this.chart instanceof PieChart;

    // Получаем актуальные данные диаграммы
    console.log(this.chart)
    // @ts-ignore
    const labels = this.chart.data.labels as string[];
    let dataset: string[];
    if (isPieChart) {
      // @ts-ignore
      dataset = this.chart.data.series as string[];
    } else {
      // @ts-ignore
      dataset = this.chart.data.series[0] as string[];
    }

    // Подготовка данных для модального окна
    const data = labels.map((label, index) => ({ name: label, value: dataset[index] }));


    // Открываем модальное окно с полями и обработчиком закрытия
    this.modal?.open([
      {
        label: 'Add Data Point',
        type: 'button',
        value: 'dataset', // Используйте соответствующее значение
        data: data
      }
    ], (data) => {
      const dataset: {[key: string]: string} = {};
      const newLabels: string[] = []
      const newDatas: string[] = []

      for (const key in data) {
        if (key.startsWith('dataset_name_')) {
          const index = key.split('_')[2]; // Получаем индекс из ключа
          const valueKey = `dataset_value_${index}`;
          if (data[valueKey]) {
            const dkey = data[key].toString() as string;
            const dval = data[valueKey] as string;
            // @ts-ignore
            dataset[dkey] = data[valueKey];
            newLabels.push(dkey)
            newDatas.push(dval)
          }
        }
      }

      if (this.chart) {
        this.div?.setAttribute('data-chart-labels', JSON.stringify(newLabels));
        this.div?.setAttribute('data-chart-dataset', JSON.stringify(newDatas));
        this.chart.update({
          labels: newLabels,
          series: isPieChart ? newDatas.map(Number) : [newDatas.map(Number)]
        });

        const editor = this.core?.editor.getEditorElement();
        if(editor) this.core?.setContent(editor.innerHTML)
      }
    }, 'Edit Chart Data');
  }

  public reloadChart(): void {
    // Implementation of chart reloading logic
  }

  public destroy(): void {
    // Detach the event listeners from the SVG element, if necessary
    if(this.div) {
      const svgElement = document.getElementById(this.div.id);
      if (svgElement) {
        svgElement.onclick = null;
      }
    }


    // If the chart library provides a method for cleanup, use it
    if (this.chart) {
      this.chart.detach(); // This is an example, adjust based on the chart library's API
    }

    // Remove the div element from the DOM
    if(this.div) this.div.remove();

    // Clean up the modal
    if (this.modal) {
      this.modal.destroy(); // Assuming Modal class has a destroy method
    }

    if (this.resizer) {
      this.resizer.destroy();
    }

    // Nullify references to help with garbage collection
    // @ts-ignore
    this.chart = null;
    // @ts-ignore
    this.modal = null;
  }
}
