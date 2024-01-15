import type EditorCoreInterface from "../src/types";

export class ResizableElement {
  private element: HTMLElement|SVGAElement;
  private resizeHandle: HTMLDivElement;
  private core: EditorCoreInterface;
  private boundDoDrag: ((e: MouseEvent) => void)|null = null;
  private boundStopDrag: (() => void)|null = null;
  private onUpdate: () => void;

  constructor(element: HTMLElement|SVGAElement, core: EditorCoreInterface, onUpdate = () => {}) {
    this.element = element;
    this.core = core;
    this.onUpdate = onUpdate;
    this.resizeHandle = document.createElement('div');

    this.resizeHandle.className = 'resize-handle';
    this.resizeHandle.style.position = 'absolute';
    this.resizeHandle.style.width = '6px';
    this.resizeHandle.style.height = '6px';
    this.resizeHandle.style.background = '#FFF';
    this.resizeHandle.style.border = '2px solid #666';
    this.resizeHandle.style.right = '0px';
    this.resizeHandle.style.bottom = '0px';
    this.resizeHandle.style.cursor = 'nwse-resize';
    this.resizeHandle.style.zIndex = '1000';

    this.resizeHandle.addEventListener('mousedown', this.startResizing.bind(this));

    this.updateResizeHandlePosition();

    this.element.addEventListener('mouseenter', this.updateResizeHandlePosition.bind(this));
    this.element.addEventListener('load', this.updateResizeHandlePosition.bind(this));
    window.addEventListener('scroll', this.updateResizeHandlePosition.bind(this));

    this.core.generalElement.appendChild(this.resizeHandle)
    // this.element.parentElement?.appendChild(this.resizeHandle);
  }


  private updateResizeHandlePosition(): void {
    if (this.resizeHandle) {
      const rect = this.element.getBoundingClientRect();

      this.resizeHandle.style.left = `${rect.right + window.scrollX - 10}px`;
      this.resizeHandle.style.top = `${rect.bottom + window.scrollY - 10}px`;
    }
  }

  private startResizing(e: MouseEvent): void {
    e.preventDefault();
    // e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = this.element.clientWidth;
    const startHeight = this.element.clientHeight;

    this.boundDoDrag = (e: MouseEvent) => {
      const newWidth = startWidth + e.clientX - startX;
      const newHeight = startHeight + e.clientY - startY;
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
      this.updateResizeHandlePosition();

      const editor = this.core.editor.getEditorElement();
      if (editor) {
        this.core.setContent(editor.innerHTML);
      }
    };

    this.boundStopDrag = () => {
      document.removeEventListener('mousemove', this.boundDoDrag!);
      document.removeEventListener('mouseup', this.boundStopDrag!);
      this.updateResizeHandlePosition();
      this.onUpdate();
    };

    document.addEventListener('mousemove', this.boundDoDrag);
    document.addEventListener('mouseup', this.boundStopDrag);
  }

  destroy(): void {
    this.element.removeEventListener('mouseenter', this.updateResizeHandlePosition);
    window.removeEventListener('scroll', this.updateResizeHandlePosition);
    this.resizeHandle.removeEventListener('mousedown', this.startResizing);

    if (this.resizeHandle.parentElement) {
      this.resizeHandle.parentElement.removeChild(this.resizeHandle);
    }
  }
}
