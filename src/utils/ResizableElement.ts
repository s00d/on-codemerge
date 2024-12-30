export class ResizableElement {
  private element: HTMLElement | null = null;
  private handles: HTMLElement[] = [];
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private aspectRatio = 1;
  private preserveAspectRatio: boolean;
  private currentPosition: string | null = null;

  constructor(preserveAspectRatio: boolean = true) {
    this.preserveAspectRatio = preserveAspectRatio;
  }

  public attachTo(element: HTMLElement): void {
    this.detach();
    this.element = element;
    this.aspectRatio = element.offsetWidth / element.offsetHeight;
    this.createHandles();
  }

  public detach(): void {
    this.handles.forEach((handle) => handle.remove());
    this.handles = [];
    this.element = null;
  }

  private createHandles(): void {
    const positions = ['nw', 'ne', 'se', 'sw']; // Только угловые маркеры

    positions.forEach((pos) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${pos}`;
      handle.addEventListener('mousedown', (e) => this.startResize(e, pos));

      if (this.element) {
        this.element.parentElement?.appendChild(handle);
        this.positionHandle(handle, pos);
      }

      this.handles.push(handle);
    });
  }

  private positionHandle(handle: HTMLElement, position: string): void {
    if (!this.element) return;

    const rect = this.element.getBoundingClientRect();
    const handleSize = 8; // Размер маркера

    switch (position) {
      case 'nw':
        handle.style.left = `${rect.left - handleSize / 2}px`;
        handle.style.top = `${rect.top - handleSize / 2}px`;
        break;
      case 'ne':
        handle.style.left = `${rect.right - handleSize / 2}px`;
        handle.style.top = `${rect.top - handleSize / 2}px`;
        break;
      case 'se':
        handle.style.left = `${rect.right - handleSize / 2}px`;
        handle.style.top = `${rect.bottom - handleSize / 2}px`;
        break;
      case 'sw':
        handle.style.left = `${rect.left - handleSize / 2}px`;
        handle.style.top = `${rect.bottom - handleSize / 2}px`;
        break;
    }
  }

  private updateHandlePositions(): void {
    if (!this.element) return;

    const rect = this.element.getBoundingClientRect();
    const handleSize = 8; // Размер маркера

    this.handles.forEach((handle, index) => {
      const position = ['nw', 'ne', 'se', 'sw'][index];
      switch (position) {
        case 'nw':
          handle.style.left = `${rect.left - handleSize / 2}px`;
          handle.style.top = `${rect.top - handleSize / 2}px`;
          break;
        case 'ne':
          handle.style.left = `${rect.right - handleSize / 2}px`;
          handle.style.top = `${rect.top - handleSize / 2}px`;
          break;
        case 'se':
          handle.style.left = `${rect.right - handleSize / 2}px`;
          handle.style.top = `${rect.bottom - handleSize / 2}px`;
          break;
        case 'sw':
          handle.style.left = `${rect.left - handleSize / 2}px`;
          handle.style.top = `${rect.bottom - handleSize / 2}px`;
          break;
      }
    });
  }

  private startResize(e: MouseEvent, position: string): void {
    if (!this.element) return;

    e.preventDefault();
    this.isResizing = true;
    this.currentPosition = position;

    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = this.element.offsetWidth;
    this.startHeight = this.element.offsetHeight;

    document.addEventListener('mousemove', this.handleResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  private handleResize = (e: MouseEvent): void => {
    if (!this.isResizing || !this.element || !this.currentPosition) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    switch (this.currentPosition) {
      case 'nw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight - deltaY;
        if (this.preserveAspectRatio) {
          newHeight = newWidth / this.aspectRatio;
        }
        break;
      case 'ne':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight - deltaY;
        if (this.preserveAspectRatio) {
          newHeight = newWidth / this.aspectRatio;
        }
        break;
      case 'se':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight + deltaY;
        if (this.preserveAspectRatio) {
          newHeight = newWidth / this.aspectRatio;
        }
        break;
      case 'sw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight + deltaY;
        if (this.preserveAspectRatio) {
          newHeight = newWidth / this.aspectRatio;
        }
        break;
    }

    // Minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(50, newHeight);

    this.element.style.width = `${newWidth}px`;
    this.element.style.height = `${newHeight}px`;

    // Обновляем позиции маркеров
    this.updateHandlePositions();
  };

  private stopResize = (): void => {
    this.isResizing = false;
    this.currentPosition = null;
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.stopResize);
  };
}
