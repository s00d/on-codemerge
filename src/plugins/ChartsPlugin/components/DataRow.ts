import type { ChartPoint } from '../types';
import { getRandomColor } from '../utils/colors';
import { deleteIcon } from '../../../icons';

export class DataRow {
  public element: HTMLElement;
  private requiresXY: boolean;
  private isScatter: boolean;
  private onChange: () => void;
  private onDelete: () => void;

  constructor(
    data: Partial<ChartPoint>,
    requiresXY: boolean,
    isScatter: boolean,
    onChange: () => void,
    onDelete: () => void
  ) {
    this.element = document.createElement('div');
    this.requiresXY = requiresXY;
    this.isScatter = isScatter;
    this.onChange = onChange;
    this.onDelete = onDelete;
    this.initialize(data);
  }

  private initialize(data: Partial<ChartPoint>): void {
    this.element.className = `grid ${this.getGridCols()} gap-2 items-center`;

    // Always generate a random color if none is provided
    const color = data.color || getRandomColor();

    this.element.innerHTML = this.requiresXY
      ? this.createXYRowContent(data, color)
      : this.createBasicRowContent(data, color);

    this.setupEventListeners();
  }

  private getGridCols(): string {
    if (this.requiresXY) {
      return this.isScatter
        ? 'grid-cols-[1fr,80px,80px,40px]' // Scatter: label, x, y, delete
        : 'grid-cols-[1fr,80px,80px,80px,40px,40px]'; // Bubble: label, x, y, size, color, delete
    }
    return 'grid-cols-[1fr,120px,40px,40px]'; // Basic: label, value, color, delete
  }

  private createBasicRowContent(data: Partial<ChartPoint>, color: string): string {
    return `
      <input type="text" class="label-input px-2 py-1 border rounded text-sm" 
             value="${data.label || ''}" placeholder="Label">
      <input type="number" class="value-input px-2 py-1 border rounded text-sm" 
             value="${data.value || ''}" placeholder="Value">
      <input type="color" class="color-input w-8 h-8 rounded cursor-pointer" 
             value="${color}" title="Point Color">
      <button class="delete-row-btn p-1 text-red-500 hover:text-red-700" title="Delete Point">${deleteIcon}</button>
    `;
  }

  private createXYRowContent(data: Partial<ChartPoint>, color: string): string {
    if (this.isScatter) {
      return `
        <input type="text" class="label-input px-2 py-1 border rounded text-sm" 
               value="${data.label || ''}" placeholder="Label">
        <input type="number" class="x-input px-2 py-1 border rounded text-sm" 
               value="${data.x || ''}" placeholder="X">
        <input type="number" class="y-input px-2 py-1 border rounded text-sm" 
               value="${data.y || ''}" placeholder="Y">
        <button class="delete-row-btn p-1 text-red-500 hover:text-red-700" title="Delete Point">${deleteIcon}</button>
      `;
    }

    return `
      <input type="text" class="label-input px-2 py-1 border rounded text-sm" 
             value="${data.label || ''}" placeholder="Label">
      <input type="number" class="x-input px-2 py-1 border rounded text-sm" 
             value="${data.x || ''}" placeholder="X">
      <input type="number" class="y-input px-2 py-1 border rounded text-sm" 
             value="${data.y || ''}" placeholder="Y">
      <input type="number" class="r-input px-2 py-1 border rounded text-sm" 
             value="${data.r || '5'}" placeholder="Size" min="1" max="100">
      <input type="color" class="color-input w-8 h-8 rounded cursor-pointer" 
             value="${color}" title="Point Color">
      <button class="delete-row-btn p-1 text-red-500 hover:text-red-700" title="Delete Point">${deleteIcon}</button>
    `;
  }

  private setupEventListeners(): void {
    this.element.addEventListener('input', this.onChange);
    this.element.querySelector('.delete-row-btn')?.addEventListener('click', this.onDelete);
  }

  public getData(): Partial<ChartPoint> {
    const data: Partial<ChartPoint> = {
      label: (this.element.querySelector('.label-input') as HTMLInputElement)?.value || '',
    };

    if (this.requiresXY) {
      data.x = parseFloat(
        (this.element.querySelector('.x-input') as HTMLInputElement)?.value || '0'
      );
      data.y = parseFloat(
        (this.element.querySelector('.y-input') as HTMLInputElement)?.value || '0'
      );

      if (!this.isScatter) {
        data.r = parseFloat(
          (this.element.querySelector('.r-input') as HTMLInputElement)?.value || '5'
        );
        data.color = (this.element.querySelector('.color-input') as HTMLInputElement)?.value;
      } else {
        data.color = getRandomColor(); // Always use random color for scatter plots
        data.r = 5; // Fixed size for scatter plots
      }

      data.value = data.y; // Use Y value as the main value
    } else {
      data.value = parseFloat(
        (this.element.querySelector('.value-input') as HTMLInputElement)?.value || '0'
      );
      data.color = (this.element.querySelector('.color-input') as HTMLInputElement)?.value;
    }

    return data;
  }
}
