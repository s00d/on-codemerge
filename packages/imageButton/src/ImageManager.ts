import { Modal } from "../../../helpers/modal";
import type { EditorCoreInterface } from "../../../src/types";
import { ContextMenu } from "../../../helpers/contextMenu";
import { DropdownMenu } from "../../../helpers/dropdownMenu";
import {ResizableElement} from "../../../helpers/ResizableElement";

export class ImageManager {
  private img: HTMLImageElement;
  private imgId: string;
  private modal: Modal;
  private core: EditorCoreInterface;
  private contextMenu: ContextMenu;
  private dropdown: DropdownMenu;
  private onRemove: (id: string) => void;
  private resizer: ResizableElement|null = null;


  constructor(core: EditorCoreInterface, img: HTMLImageElement, onRemove: (id: string) => void) {
    this.img = img;
    this.imgId = img.id;
    this.modal = new Modal(core);
    this.onRemove = onRemove;
    this.core = core;
    this.contextMenu = new ContextMenu(core);
    this.dropdown = new DropdownMenu(core, 'Align');
    this.dropdown.addItem('Left', () => this.applyAlignment(core, 'left'))
    this.dropdown.addItem('Right', () => this.applyAlignment(core, 'right'))
    this.dropdown.addItem('Center', () => this.applyAlignment(core, 'center'))
    this.dropdown.addItem('Normal', () => this.applyAlignment(core, 'normal'))


    this.contextMenu.addItem('Change Style', () => this.showImageModal());
    this.contextMenu.addHtmlItem(this.dropdown.getButton());

    this.img.addEventListener('contextmenu', this.handleContextMenu.bind(this));

    this.observeImageRemoval();

    const editor = this.core?.editor.getEditorElement();
    if(editor) this.core?.setContent(editor.innerHTML)
  }

  addResizer() {
    this.resizer = new ResizableElement(this.img, this.core);
  }

  private handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.contextMenu.show(event.clientX, event.clientY);
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

  private applyAlignment(core: EditorCoreInterface, align: string): void {
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
    if (this.resizer) {
      this.resizer.destroy();
    }
    this.onRemove(this.imgId);
  }

  destroy(): void {
    // Remove any event listeners or perform other cleanup as needed
    this.img.removeEventListener('contextmenu', this.handleContextMenu);

    if (this.resizer) {
      this.resizer.destroy();
    }

    if (this.contextMenu) {
      this.contextMenu.destroy();
      // @ts-ignore
      this.contextMenu = null;
    }

    if (this.dropdown) {
      this.dropdown.destroy();
      // @ts-ignore
      this.dropdown = null;
    }

    // Set other properties to null to release references
    // @ts-ignore
    this.img = null;
    // @ts-ignore
    this.imgId = null;
    // @ts-ignore
    this.modal = null;
    // @ts-ignore
    this.core = null;
    // @ts-ignore
    this.onRemove = null;
    // @ts-ignore
    this.resizeHandle = null;
  }
}
