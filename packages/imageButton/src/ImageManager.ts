import { Modal } from "../../../helpers/modal";
import type { EditorCore } from "@/index";
import { ContextMenu } from "../../../helpers/contextMenu";
import { DropdownMenu } from "../../../helpers/dropdownMenu";

export class ImageManager {
  private img: HTMLImageElement;
  private imgId: string;
  private modal: Modal;
  private core: EditorCore;
  private contextMenu: ContextMenu;
  private dropdown: DropdownMenu;
  private resizeHandle: HTMLDivElement;
  private onRemove: (id: string) => void;

  constructor(core: EditorCore, img: HTMLImageElement, onRemove: (id: string) => void) {
    this.img = img;
    this.imgId = img.id;
    this.modal = new Modal(core);
    this.onRemove = onRemove;
    this.core = core;
    this.contextMenu = new ContextMenu(core);
    this.dropdown = new DropdownMenu(core, 'Align')
    this.dropdown.addItem('Left', () => this.applyAlignment(core, 'left'))
    this.dropdown.addItem('Right', () => this.applyAlignment(core, 'right'))
    this.dropdown.addItem('Center', () => this.applyAlignment(core, 'center'))
    this.dropdown.addItem('Normal', () => this.applyAlignment(core, 'normal'))

    this.contextMenu.addItem('Change Style', () => this.showImageModal());
    this.contextMenu.addHtmlItem(this.dropdown.getButton());

    this.img.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      this.contextMenu.show(event.clientX, event.clientY);
    });
    this.resizeHandle = document.createElement('div');
    this.addResizeHandle();
    this.observeImageRemoval();
  }

  private observeImageRemoval() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.removedNodes) {
          mutation.removedNodes.forEach((removedNode) => {
            if (removedNode === this.img) {
              this.remove();
              observer.disconnect(); // После удаления отключаем наблюдатель
            }
          });
        }
      });
    });

    const editor = this.core.editor.getEditorElement();
    if(editor) observer.observe(editor, { childList: true, subtree: true });
  }

  private applyAlignment(core: EditorCore, align: string): void {
    switch (align) {
      case 'left':
      case 'right':
        this.img.style.margin = '0';
        this.img.style.float = align;
        break;
      case 'center':
        this.img.style.float = 'none';
        this.img.style.margin = '10px auto';
        break;
      case 'normal':
        this.img.style.float = 'none';
        break;
    }


    const editor = core.editor.getEditorElement();
    if(editor) core.setContent(editor.innerHTML);

    this.contextMenu.hide();
  }

  private addResizeHandle(): void {
    this.resizeHandle.className = 'resize-handle';
    this.resizeHandle.style.position = 'absolute';
    this.resizeHandle.style.width = '4px';
    this.resizeHandle.style.height = '4px';
    this.resizeHandle.style.background = '#FFF';
    this.resizeHandle.style.border = '2px solid #666';
    this.resizeHandle.style.right = '-2px';
    this.resizeHandle.style.bottom = '-2px';
    this.resizeHandle.style.cursor = 'nwse-resize';
    this.resizeHandle.style.zIndex = '1000';

    this.resizeHandle.addEventListener('mousedown', this.startResizing.bind(this));

    // Инициализация позиции ресайзера
    this.updateResizeHandlePosition();

    // Добавление обработчиков событий для обновления позиции ресайзера
    this.img.addEventListener('mouseenter', () => this.updateResizeHandlePosition());
    this.img.addEventListener('load', () => this.updateResizeHandlePosition());
    window.addEventListener('scroll', () => this.updateResizeHandlePosition());

    this.img.parentElement?.appendChild(this.resizeHandle);
  }

  private updateResizeHandlePosition(): void {
    if (this.resizeHandle && this.img) {
      const imgRect = this.img.getBoundingClientRect();
      this.resizeHandle.style.left = `${imgRect.right + window.scrollX - 10}px`; // Учитываем прокрутку
      this.resizeHandle.style.top = `${imgRect.bottom + window.scrollY - 10}px`;
    }
  }


  private startResizing(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = this.img.clientWidth;
    const startHeight = this.img.clientHeight;

    const doDrag = (e: MouseEvent) => {
      const newWidth = startWidth + e.clientX - startX;
      const newHeight = startHeight + e.clientY - startY;
      this.img.style.width = `${newWidth}px`;
      this.img.style.height = `${newHeight}px`;
      this.updateResizeHandlePosition();

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core.setContent(editor?.innerHTML)
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag, false);
      document.removeEventListener('mouseup', stopDrag, false);
      this.updateResizeHandlePosition();
    };

    document.addEventListener('mousemove', doDrag, false);
    document.addEventListener('mouseup', stopDrag, false);
  }

  private showImageModal(): void {
    const alt = this.img.alt ?? '';
    const width = (this.img.width ?? 0).toString();
    const height = (this.img.height ?? 0).toString();


    this.modal.open([
      { label: "alt", value: alt, type: 'text' },
      { label: "width", value: width, type: 'number' },
      { label: "height", value: height, type: 'number' },
    ], (data) => {
      this.img.alt = data.alt.toString();
      this.img.width = parseInt(data.width.toString());
      this.img.height = parseInt(data.height.toString());

      console.log("Modal closed with data:", data);

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core.setContent(editor?.innerHTML)
    });
  }

  private remove(): void {
    this.img.remove();
    if (this.resizeHandle && this.resizeHandle.parentElement) {
      this.resizeHandle.parentElement.removeChild(this.resizeHandle);
    }
    this.onRemove(this.imgId);
  }

  // Другие методы управления изображением
}
