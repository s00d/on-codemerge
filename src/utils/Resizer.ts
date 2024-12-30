// Resizer.ts
type ResizerOptions = {
  handleSize?: number; // Размер точки для ресайза
  handleColor?: string; // Цвет точки для ресайза
  onResizeStart?: () => void; // Событие начала ресайза
  onResize?: (width: number, height: number) => void; // Событие изменения размера
  onResizeEnd?: () => void; // Событие завершения ресайза
  minWidth?: number; // Минимальная ширина элемента
  minHeight?: number; // Минимальная высота элемента
  maxWidth?: number; // Максимальная ширина элемента
  maxHeight?: number; // Максимальная высота элемента
};

export class Resizer {
  private element: HTMLElement; // Элемент, который нужно ресайзить
  private handle: HTMLDivElement | null = null; // Точка для ресайза
  private isResizing = false; // Флаг, указывающий, что ресайз активен
  private startX = 0; // Начальная позиция курсора по X
  private startY = 0; // Начальная позиция курсора по Y
  private startWidth = 0; // Начальная ширина элемента
  private startHeight = 0; // Начальная высота элемента
  private options: ResizerOptions; // Настройки ресайзера

  constructor(element: HTMLElement, options: ResizerOptions = {}) {
    this.element = element;
    this.options = {
      handleSize: 10,
      handleColor: 'blue',
      minWidth: 50, // Минимальная ширина по умолчанию
      minHeight: 50, // Минимальная высота по умолчанию
      ...options,
    };
    this.createResizeHandle();
  }

  private createResizeHandle(): void {
    // Удаляем предыдущий handle, если он есть
    const existingHandle = this.element.querySelector('.resize-handle');
    if (existingHandle) {
      existingHandle.remove();
    }

    // Создаем новый handle
    this.handle = document.createElement('div');
    this.handle.className = 'resize-handle';
    this.handle.style.position = 'absolute';
    this.handle.style.right = '0';
    this.handle.style.bottom = '0';
    this.handle.style.width = `${this.options.handleSize}px`;
    this.handle.style.height = `${this.options.handleSize}px`;
    this.handle.style.backgroundColor = this.options.handleColor ?? 'blue';
    this.handle.style.cursor = 'se-resize';

    // Добавляем handle в элемент
    this.element.style.position = 'relative';
    this.element.appendChild(this.handle);

    // Обработчик для изменения размера
    this.handle.addEventListener('mousedown', (e) => this.startResize(e));
    document.addEventListener('mousemove', (e) => this.resize(e));
    document.addEventListener('mouseup', () => this.stopResize());
  }

  private startResize(e: MouseEvent): void {
    this.isResizing = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = this.element.offsetWidth;
    this.startHeight = this.element.offsetHeight;

    // Вызываем событие начала ресайза
    this.options.onResizeStart?.();

    e.preventDefault();
  }

  private resize(e: MouseEvent): void {
    if (this.isResizing && this.handle) {
      // Вычисляем новые размеры
      let newWidth = this.startWidth + (e.clientX - this.startX);
      let newHeight = this.startHeight + (e.clientY - this.startY);

      // Ограничиваем размеры минимальными и максимальными значениями
      if (this.options.minWidth !== undefined && newWidth < this.options.minWidth) {
        newWidth = this.options.minWidth;
      }
      if (this.options.maxWidth !== undefined && newWidth > this.options.maxWidth) {
        newWidth = this.options.maxWidth;
      }
      if (this.options.minHeight !== undefined && newHeight < this.options.minHeight) {
        newHeight = this.options.minHeight;
      }
      if (this.options.maxHeight !== undefined && newHeight > this.options.maxHeight) {
        newHeight = this.options.maxHeight;
      }

      // Применяем новые размеры
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;

      // Вызываем событие изменения размера
      this.options.onResize?.(newWidth, newHeight);
    }
  }

  private stopResize(): void {
    this.isResizing = false;

    // Вызываем событие завершения ресайза
    this.options.onResizeEnd?.();
  }

  public destroy(): void {
    if (this.handle) {
      this.handle.remove();
    }
    document.removeEventListener('mousemove', (e) => this.resize(e));
    document.removeEventListener('mouseup', () => this.stopResize());
  }
}
