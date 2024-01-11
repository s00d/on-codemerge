import type { EditorCore } from "@/index";

type MenuOrientation = 'vertical' | 'horizontal';

export class ContextMenu {
  private menuElement: HTMLElement;
  private orientation: MenuOrientation = 'vertical';
  private visible: boolean = false;
  private core: EditorCore;

  constructor(core: EditorCore) {
    this.core = core;
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
      maxWidth: '500px',
      flexFlow: 'wrap',
      // Дополнительные стили
    });

    this.core?.generalElement.appendChild(this.menuElement);

    // document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  private handleDocumentClick(event: MouseEvent): void {
    // Проверяем, был ли клик вне меню
    const target = event.target as HTMLElement;
    if (this.visible && !this.menuElement.contains(target)) {
      this.hide();
    }
  }

  setOrientation(orientation: MenuOrientation): void {
    this.orientation = orientation;
    this.applyOrientationStyles();
  }

  private applyOrientationStyles(): void {
    if (this.orientation === 'horizontal') {
      this.applyStyles(this.menuElement, {
        display: 'flex',
        flexDirection: 'row',
      });
    } else {
      this.applyStyles(this.menuElement, {
        display: 'flex',
        flexDirection: 'column',
      });
    }
  }

  addHtmlItem(item: HTMLElement): void {
    this.menuElement.appendChild(item);
  }

  addItem(label: string, action: () => void): void {
    const item = document.createElement('div');
    item.classList.add('on-codemerge-button');
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
    this.core.saveCurrentSelection();

    // Рассчитываем ширину и половину ширины меню
    const menuWidth = this.menuElement.offsetWidth;
    const halfMenuWidth = menuWidth / 2;

    // Проверяем, выходит ли меню за правый край окна
    if (x + menuWidth > window.innerWidth) {
      // Выравниваем меню справа, если выходит за пределы
      this.menuElement.style.left = `${x - menuWidth + window.scrollX}px`;
    } else if (x - halfMenuWidth < 0) {
      // Центрируем меню, если не хватает места слева
      this.menuElement.style.right = `${x - window.scrollX}px`;
    } else {
      // Обычное позиционирование
      this.menuElement.style.left = `${x + window.scrollX}px`;
    }

    // Корректируем позицию, чтобы меню не выходило за левый край окна
    const currentLeft = parseInt(this.menuElement.style.left, 10);
    if (currentLeft < 0) {
      this.menuElement.style.left = `${window.scrollX}px`;
    }

    this.menuElement.style.top = `${y + window.scrollY}px`;

    this.menuElement.style.display = 'flex';
    this.visible = true;
  }

  hide(): void {
    this.menuElement.style.display = 'none';
    this.visible = false;
  }

  change(x: number, y: number) {
    if (this.visible) {
      this.hide()
    } else {
      this.show(x, y)
    }
  }

  clearItems(): void {
    this.menuElement.innerHTML = '';
  }

  destroy(): void {
    // Удаляем обработчик клика за пределами меню
    document.removeEventListener('click', this.handleDocumentClick);

    // Удаляем DOM элементы, созданные для меню
    this.menuElement.remove();
    // @ts-ignore
    this.menuElement = null;
  }
}
