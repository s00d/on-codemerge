import type { EditorCore } from "@/index";
import { ImageManager } from './ImageManager';
import image from "../../../icons/image.svg";
import type { IEditorModule } from "@/types";

export class ImageButton implements IEditorModule {
  private core: EditorCore | null = null;
  private imageManagerMap: Map<string, ImageManager> = new Map();

  initialize(core: EditorCore): void {
    this.core = core;
    core.toolbar.addButtonIcon('Image', image, () => this.onInsertImageClick())
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

  // Дополнительные методы, если они вам нужны
}

export default ImageButton
