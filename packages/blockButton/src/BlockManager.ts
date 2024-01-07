import {EditorCore} from "@/index";
import {ContextMenu} from "@root/helpers/contextMenu";
import {Modal} from "@root/helpers/modal";
import {StyleManager} from "@root/packages/tableButton/src/StyleManager";

export class BlockManager {
  private block: HTMLElement;
  private core: EditorCore;
  private onUpdate: () => void;
  private sections: HTMLElement[] = [];
  private currentActiveSection: HTMLElement|null = null;
  private contextMenu: ContextMenu;
  private modal: Modal;
  private placeholder: HTMLDivElement|null = null;
  private styleManager: StyleManager;

  constructor(block: HTMLElement, core: EditorCore, onUpdate: () => void) {
    this.block = block;
    this.core = core;
    this.onUpdate = onUpdate;
    this.contextMenu = new ContextMenu(core);
    this.contextMenu.setOrientation('horizontal')
    this.modal = new Modal();
    this.styleManager = new StyleManager();

    this.initContextMenu();
    this.addInitialSections(2); // Начнем с двух секций

    const heightResizer = this.createHeightResizer();
    this.block.appendChild(heightResizer);
  }

  public attachEventsToExistingResizers(): void {
    const heightResizers = this.block.querySelectorAll('.editor-block-height-resizer');
    heightResizers.forEach(resizer => this.attachHeightResizerEvents(resizer as HTMLElement));

    const widthResizers = this.block.querySelectorAll('.editor-block-resizer');
    widthResizers.forEach(resizer => this.attachWidthResizerEvents(resizer as HTMLElement));

    const sections = this.block.querySelectorAll('.section');
    sections.forEach(section => {
      section.addEventListener('click', () => {
        const selectSection = section as HTMLElement
        this.currentActiveSection = selectSection;
        selectSection.focus();
      });
    });

  }

  private attachHeightResizerEvents(resizer: HTMLElement): void {
    resizer.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      let isResizing = true;
      const initialY = e.clientY; // Фиксируем начальное положение курсора
      const initialHeight = this.block.offsetHeight; // Фиксируем начальную высоту блока

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const currentY = e.clientY;
        const dy = currentY - initialY; // Разница между текущим и начальным положением курсора

        const newHeight = Math.max(initialHeight + dy, 100); // Вычисляем новую высоту
        this.block.style.height = `${newHeight}px`; // Применяем новую высоту
      };

      const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  private attachWidthResizerEvents(resizer: HTMLElement): void {
    resizer.addEventListener('mousedown', (e: MouseEvent) => {
      resizer.style.display = 'none'
      e.preventDefault();
      let isResizing = true;
      let initialX = e.clientX;

      let prevSection: HTMLElement|null = resizer.previousElementSibling as HTMLElement;
      let nextSection: HTMLElement|null = resizer.nextElementSibling as HTMLElement;
      if(prevSection.classList.contains('editor-block-height-resizer')) {
        prevSection = null;
      }
      if(nextSection.classList.contains('editor-block-height-resizer')) {
        nextSection = null;
      }
      let initialLeftWidth = prevSection?.offsetWidth ?? 0;
      let initialRightWidth = nextSection?.offsetWidth ?? 0;


      this.placeholder = document.createElement('div');
      this.placeholder.className = 'on-placeholder';
      this.applyStyles(this.placeholder, {
        width: '1px',
        background: '#ccc',
        transition: 'width 0.3s ease',
        padding: '3px',
      });

      const parentSection = resizer.parentNode as HTMLElement;
      parentSection.insertBefore(this.placeholder, resizer.nextSibling);

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing || !prevSection || !nextSection) return;

        const dx = e.clientX - initialX;
        const newLeftWidth = initialLeftWidth + dx;
        const newRightWidth = initialRightWidth - dx;

        if (newLeftWidth > 50 && newRightWidth > 50) {
          prevSection.style.flex = `0 0 ${newLeftWidth}px`;
          nextSection.style.flex = `0 0 ${newRightWidth}px`;
        }
      };


      const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Удаление плейсхолдера после завершения перетаскивания
        this.placeholder && this.placeholder.parentNode?.removeChild(this.placeholder);
        resizer.style.display = 'unset'

        const editor = this.core?.editor.getEditorElement();
        if(editor) this.core.setContent(editor?.innerHTML)
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  private createHeightResizer(): HTMLElement {
    const heightResizer = document.createElement('div');
    heightResizer.className = 'editor-block-height-resizer';

    this.attachHeightResizerEvents(heightResizer);

    return heightResizer;
  }

  private initContextMenu(): void {
    this.block.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const target = event.target as HTMLElement;
      const section = target.closest('.section'); // Предполагаем, что у секций есть класс 'editor-section'
      if (section) {
        this.currentActiveSection = section as HTMLElement;
      }

      this.contextMenu.clearItems();
      this.contextMenu.addItem('Add Section', () => this.addSection());
      this.sections.forEach((section, index) => {
        if (this.sections.length > 1) {
          this.contextMenu.addItem(`Remove Section ${index + 1}`, () => this.removeSection(section));
        }
      });
      this.contextMenu.addItem('Change Style', () => this.openSectionSettings());
      this.contextMenu.show(event.clientX, event.clientY);
    });

    window.addEventListener('click', (event: MouseEvent) => {
      if (!this.block.contains(event.target as Node)) {
        this.contextMenu.hide();
      }
    });
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  private removeSection(section: HTMLElement): void {
    // Находим индекс удаляемой секции
    const index = this.sections.indexOf(section);

    if (index > -1) {
      // Удаляем секцию
      this.block.removeChild(section);
      this.sections.splice(index, 1);

      // Удаляем резайзер перед или после секции, если он есть
      if (index > 0) {
        // Удаляем резайзер перед секцией, если это не первая секция
        const resizerBefore = this.sections[index - 1].nextElementSibling;
        if (resizerBefore && resizerBefore.classList.contains('editor-block-resizer')) {
          this.block.removeChild(resizerBefore);
        }
      } else if (this.sections.length > 0) {
        // Удаляем резайзер после секции, если это была первая секция и еще остались секции
        const resizerAfter = section.nextElementSibling;
        if (resizerAfter && resizerAfter.classList.contains('editor-block-resizer')) {
          this.block.removeChild(resizerAfter);
        }
      }

      // Пересоздаем резайзеры для оставшихся секций
      this.recreateResizers();
      this.updateSectionSizes();
    }

    this.onUpdate();
  }

  updateSectionSizes(): void {
    if (this.sections.length === 0) return;

    const newWidth = 100 / this.sections.length;
    this.sections.forEach((section) => {
      section.style.flex = `0 0 ${newWidth}%`;
    });
  }

  private addInitialSections(count: number): void {
    for (let i = 0; i < count; i++) {
      this.addSection();
    }
  }

  private addSection(): void {
    const section = document.createElement('div');
    section.style.flex = '1';
    section.classList.add('section');
    section.addEventListener('click', () => {
      this.currentActiveSection = section;
      section.focus();
    });

    if (this.sections.length > 0) {
      const resizer = this.createResizer();
      this.block.appendChild(resizer);

      // Пересчет размеров существующих секций
      let totalWidth = 0;
      this.sections.forEach((sec) => {
        totalWidth += sec.offsetWidth;
      });
      const newWidth = totalWidth / (this.sections.length + 1);
      this.sections.forEach((sec) => {
        sec.style.flex = `0 0 ${newWidth}px`;
      });
      section.style.flex = `0 0 ${newWidth}px`;
    }

    this.block.appendChild(section);
    this.sections.push(section);

    this.recreateResizers();

    this.onUpdate();
  }

  recreateResizers(): void {
    // Удаляем все существующие резайзеры
    const existingResizers = this.block.querySelectorAll('.editor-block-resizer');
    existingResizers.forEach(resizer => resizer.remove());

    // Добавляем резайзеры заново между всеми секциями
    this.sections.slice(0, -1).forEach((section) => {
      const resizer = this.createResizer();
      this.block.insertBefore(resizer, section.nextSibling);
    });
  }

  rgbToHex(rgb: string): string {
    const rgbMatch = rgb.match(/\d+/g);
    if (!rgbMatch) {
      return rgb; // Возвращаем исходную строку, если не соответствует ожидаемому формату
    }
    return '#' + rgbMatch.map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private openSectionSettings(): void {
    if(!this.currentActiveSection) return;
    const style = this.currentActiveSection.style;
    const backgroundColor = style.backgroundColor === '' ? '#ffffff' : this.rgbToHex(style.backgroundColor);
    const color = style.color === '' ? '#000000' : this.rgbToHex(style.color);
    const padding = style.padding === '' ? '0' : style.padding.replace('px', '');
    const margin = style.margin === '' ? '0' : style.margin.replace('px', '');
    const fontSize = style.fontSize === '' ? '16' : style.fontSize.replace('px', '');
    console.log(backgroundColor)
    this.modal.open([
      { label: "color", value: color, type: 'color' },
      { label: "backgroundColor", value: backgroundColor, type: 'color' },
      { label: "padding", value: padding, type: 'number' },
      { label: "margin", value: margin, type: 'number' },
      { label: "font size", value: fontSize, type: 'number' }
    ], (data) => {
      if(!this.currentActiveSection) return;
      this.applyStyles(this.currentActiveSection, {
        backgroundColor: data.backgroundColor.toString(),
        color: data.color.toString(),
        padding: data.padding.toString() + 'px',
        margin: data.margin.toString() + 'px',
        fontSize: data['font size'].toString() + 'px',
      })
      console.log("Modal closed with data:", data);

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core.setContent(editor?.innerHTML)
    });
  }

  private createResizer(): HTMLElement {
    const resizer = document.createElement('div');
    resizer.classList.add('editor-block-resizer');

    this.attachWidthResizerEvents(resizer);

    return resizer;
  }
}
