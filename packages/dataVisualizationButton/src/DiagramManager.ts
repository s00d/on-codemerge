import { BarChart, LineChart, PieChart } from 'chartist';
import type { EditorCoreInterface } from "../../../src/types";
import { Modal } from "../../../helpers/modal";
import { ResizableElement } from "../../../helpers/ResizableElement";

export class DiagramManager {
  private core: EditorCoreInterface;
  private div: HTMLDivElement | null = null;
  private chart: BarChart | LineChart | PieChart | null = null;
  private modal: Modal | null = null;
  private divEditBlock: HTMLDivElement | null = null;
  private resizer: ResizableElement|null = null;
  private labels: string[] = []
  private dataset: number[][] = []
  private addRowButton: HTMLButtonElement|null = null;
  private addDataButton: HTMLButtonElement|null = null;

  constructor(core: EditorCoreInterface, labels: string[]|null = null, dataset: number[][]|null = null) {
    this.core = core;
    this.modal = new Modal(this.core, '600px');
    if(labels) this.labels = labels
    if(dataset) this.dataset = dataset
  }

  private createEditor() {
    this.divEditBlock = document.createElement('div');

    this.initializeButtons();

    const inputsBlock = document.createElement('div');
    this.divEditBlock.appendChild(inputsBlock);

    this.initializeRows(inputsBlock);
    return this.divEditBlock;
  }

  private initializeRows(inputsBlock: HTMLDivElement) {
    if (!this.labels.length) {
      this.addRow(inputsBlock, 0);
    } else {
      this.labels.forEach((_, index) => this.addRow(inputsBlock, index, false));
    }
  }

  private addRow(inputsBlock: HTMLDivElement, index: number, init: boolean = true) {
  // Если это инициализация, устанавливаем значение по умолчанию для labels и dataset
    if(init) {
      this.labels[index] = this.labels[index] ?? 'name';
      this.dataset[index] = this.dataset[index] ?? [0];
    }

    const row = this.createRow(index);
    inputsBlock.appendChild(row);
  }

  private createRow(index: number): HTMLDivElement {
    const row = document.createElement('div');
    row.classList.add('input-row');
    row.style.overflow = 'scroll';
    row.id = `row-${index}`;

    const labelInput = this.createLabelInput(index);
    row.appendChild(labelInput);

  // Создание инпутов для данных на основе текущего размера dataset
    this.dataset[0].forEach((_, dataIndex) => {
      const dataInput = this.createDataInput(index, dataIndex);
      row.appendChild(dataInput);
    });

    return row;
  }

  private createLabelInput(index: number): HTMLInputElement {
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = this.labels[index] ?? 'name';
    labelInput.placeholder = 'Enter label';
    labelInput.id = `label-${index}`;
    labelInput.addEventListener('input', (e) => {
      this.labels[index] = (e.target as HTMLInputElement).value;
    });
    return labelInput;
  }

  private createDataInput(index: number, dataIndex: number): HTMLInputElement {
    const dataInput = document.createElement('input');
    dataInput.type = 'number';
    dataInput.value = (this.dataset[index][dataIndex] ?? '0').toString();
    dataInput.placeholder = `Enter data ${dataIndex + 1}`;
    dataInput.id = `data-${index}-${dataIndex}`;
    dataInput.addEventListener('input', (e) => {
      this.dataset[index][dataIndex] = parseInt((e.target as HTMLInputElement).value);
    });
    return dataInput;
  }

  private initializeButtons() {
    const buttonsBlock = this.createButtonsBlock();
    this.divEditBlock?.appendChild(buttonsBlock);
  }

  private createButtonsBlock(): HTMLDivElement {
    const buttonsBlock = document.createElement('div');

    this.addRowButton = document.createElement('button');
    this.addRowButton.textContent = 'Add New Dataset';
    this.addRowButton.onclick = () => this.addRow(this.divEditBlock!, this.labels.length);
    buttonsBlock.appendChild(this.addRowButton);

    this.addDataButton = document.createElement('button');
    this.addDataButton.textContent = 'Add Data Column';
    this.addDataButton.onclick = this.addDataColumn.bind(this);
    buttonsBlock.appendChild(this.addDataButton);

    return buttonsBlock;
  }

  private addDataColumn() {
    const rows = document.querySelectorAll('.input-row');
    const newDataIndex = this.dataset[0].length; // Берем количество столбцов из первой строки

    rows.forEach((row, index) => {
      if (index >= this.dataset.length) {
        // Для новых строк, которые не имеют данных
        this.dataset.push(new Array(newDataIndex + 1).fill(0));
      } else {
        // Добавляем новые данные в существующие строки
        this.dataset[index].push(0);
      }

      const dataInput = this.createDataInput(index, newDataIndex);
      row.appendChild(dataInput);
    });

  }


  private changeEdit(val: string) {
    if(!this.divEditBlock) return;
    const parent = this.divEditBlock.parentElement as HTMLElement;
    this.divEditBlock?.remove();
    this.divEditBlock = null;
    this.labels = [];
    this.dataset = [];
    const inputWrapper = this.createEditor();
    parent.appendChild(inputWrapper);
    if(this.addDataButton) {
      if (val === 'pie') {
        this.addDataButton.style.display = 'none'
      } else {
        this.addDataButton.style.display = 'unset'
      }
    }
  }


  create(onSave: (type: string) => void, onClose: () => void) {
    this.modal?.open([
      { label: 'Chart Type', type: 'select', value: 'line', options: [
          { value: 'line', label: 'Line' },
          { value: 'bar', label: 'Bar' },
          { value: 'pie', label: 'Pie' },
          // Добавьте другие типы графиков
        ], onChange: this.changeEdit.bind(this) },
      { label: 'dataset', type: 'block', div: this.createEditor() },
    ], (data) => {
      onSave(data['Chart Type'] as string);
    }, 'Char Data', onClose)
  }

  show(charId: string, chartType: string) {
    // Создание элемента canvas для графика
    this.div = document.createElement('div');
    this.div.id = 'block-' + charId;
    this.div.contentEditable = 'false';
    this.div.setAttribute('data-chart-type', chartType);
    this.div.setAttribute('data-chart-labels', JSON.stringify(this.labels));
    this.div.setAttribute('data-chart-dataset', JSON.stringify(this.dataset));

    this.core.insertHTMLIntoEditor(this.div.outerHTML);

    this.resizer = new ResizableElement(this.div, this.core);


    const chartData = {
      labels: this.labels,
      series: this.dataset // Преобразование строк в числа
    };

    switch (chartType) {
      case 'line':
        this.chart = new LineChart('#' + this.div.id, chartData);
        break;
      case 'bar':
        this.chart = new BarChart('#' + this.div.id, chartData);
        break;
      case 'pie':
        this.chart = new PieChart('#' + this.div.id, {
          labels: this.labels,
          series: this.dataset.map(row => row[0])
        });
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

  private openEditModal() {
    const isPieChart = this.chart instanceof PieChart;

    // Открываем модальное окно с полями и обработчиком закрытия
    this.modal?.open([
      { label: 'dataset', type: 'block', div: this.createEditor() }
    ], () => {
      if (this.chart) {
        this.div?.setAttribute('data-chart-labels', JSON.stringify(this.labels));
        this.div?.setAttribute('data-chart-dataset', JSON.stringify(this.dataset));
        this.chart.update({
          labels: this.labels,
          series: isPieChart ? this.dataset.map(row => row[0]) : this.dataset
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
    if (this.divEditBlock) {
      this.divEditBlock.remove();
    }
    if (this.addRowButton) {
      this.addRowButton.remove();
    }
    if (this.addDataButton) {
      this.addDataButton.remove();
    }

    // Nullify references to help with garbage collection
    // @ts-ignore
    this.chart = null;
    // @ts-ignore
    this.modal = null;
  }
}
