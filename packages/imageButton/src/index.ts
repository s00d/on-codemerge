import { ImageManager } from './ImageManager';
import { image } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class ImageButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private imageManagerMap: Map<string, ImageManager> = new Map();
  private button: HTMLDivElement | null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.button = core.toolbar.addButtonIcon('Image', image, this.onInsertImageClick.bind(this))

    core.subscribeToContentChange(() => {
      this.reloadImages(core)
    });

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Line');
  }

  public reloadImages(core: EditorCoreInterface): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const tables = editor.querySelectorAll('img');
    tables.forEach((image: HTMLImageElement) => {
      let blockId = image.id;
      if (!blockId || blockId === '' || !blockId.startsWith('table-')) {
        image.id = blockId = 'img-' + Math.random().toString(36).substring(2, 11)
      }

      if (!this.imageManagerMap.has(blockId)) {
        // Если для этой таблицы еще нет TableManager, создаем его
        const imageManager = new ImageManager(this.core!, image, this.removeImage.bind(this));
        this.imageManagerMap.set(blockId, imageManager);
      }
    });
  }

  private onInsertImageClick = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => this.insertImage(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  private insertImage(src: string): void {
    const block = document.createElement('div');
    block.classList.add('image-block')
    const img = document.createElement('img');
    img.src = src;
    img.style.display = 'block';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.resize = 'both';
    img.style.overflow = 'auto';
    img.id = 'img-' + Math.random().toString(36).substring(2, 11)

    this.core?.insertHTMLIntoEditor(img)

    const imageManager = new ImageManager(this.core!, img, this.removeImage.bind(this));
    this.imageManagerMap.set(img.id, imageManager);
  }

  private removeImage(id: string) {
    this.imageManagerMap.delete(id);
  }

  destroy(): void {
    // Cleanup any resources or event listeners here
    this.core = null;
    this.imageManagerMap.clear();

    this.button?.removeEventListener('click', this.onInsertImageClick)
    this.button = null;
  }
}

export default ImageButton
