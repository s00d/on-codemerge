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

    core.eventManager.subscribe('fileDrop', this.handleDragAndDropFile.bind(this));
  }

  private handleDragAndDropFile(data: { fileName: string, fileContent: string, isImage: boolean }): void {
    if (data.isImage) {
      // Insert the image if the dropped file is an image
      this.insertImage(data.fileContent);
    }
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Line');
  }

  public reloadImages(core: EditorCoreInterface): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const images = editor.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      const imageId = img.id || 'img-' + Math.random().toString(36).substring(2, 11);
      img.id = imageId;

      if (!this.imageManagerMap.has(imageId)) {
        console.log('reload', imageId)
        const imageManager = new ImageManager(this.core!, img, this.removeImage.bind(this));
        this.imageManagerMap.set(imageId, imageManager);

        imageManager.addResizer();
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

    const imageManager = new ImageManager(this.core!, img, this.removeImage.bind(this));
    this.imageManagerMap.set(img.id, imageManager);

    this.core?.insertHTMLIntoEditor(img)

    imageManager.addResizer();
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
