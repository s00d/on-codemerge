export class ContextMenu {
  private menuElement: HTMLElement;
  private visible: boolean = false;

  constructor() {
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'context-menu';
    this.menuElement.style.display = 'none';

    // Применение стилей к элементу меню
    this.applyStyles(this.menuElement, {
      position: 'absolute',
      display: 'none',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      zIndex: '1000',
      // Дополнительные стили
    });

    document.body.appendChild(this.menuElement);
  }

  addItem(label: string, action: () => void): void {
    const item = document.createElement('div');
    item.textContent = label;

    // Применение стилей к пунктам меню
    this.applyStyles(item, {
      padding: '8px 12px',
      cursor: 'pointer',
      // Дополнительные стили для пунктов меню
    });

    item.addEventListener('click', () => {
      action();
      this.hide();
    });

    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#f0f0f0';
    });

    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = '';
    });

    this.menuElement.appendChild(item);
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  show(x: number, y: number): void {
    this.menuElement.style.left = `${x}px`;
    this.menuElement.style.top = `${y}px`;
    this.menuElement.style.display = 'block';
    this.visible = true;
  }

  hide(): void {
    this.menuElement.style.display = 'none';
    this.visible = false;
  }

  clearItems(): void {
    this.menuElement.innerHTML = '';
  }
}
