import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ImageUploader } from './services/ImageUploader';
import { ImageContextMenu } from './components/ImageContextMenu';
import { ResizableElement } from '../../utils/ResizableElement';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { ImageCommand } from './commands/ImageCommand';
import { imageIcon } from '../../icons';

export class ImagePlugin implements Plugin {
  name = 'image';
  private editor: HTMLEditor | null = null;
  private uploader: ImageUploader;
  private contextMenu: ImageContextMenu | null = null;
  private resizer: ResizableElement;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.uploader = new ImageUploader();
    this.resizer = new ResizableElement();
  }

  initialize(editor: HTMLEditor): void {
    this.contextMenu = new ImageContextMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.setupImageEvents();
    this.editor.on('image', () => {
      this.handleImageUpload();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: imageIcon,
        title: this.editor?.t('Insert Image'),
        onClick: () => this.handleImageUpload(),
      });
      toolbar.appendChild(this.toolbarButton);
    }
  }

  private setupImageEvents(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    // Привязка общих функций к событиям
    container.addEventListener('contextmenu', this.handleContextMenu);
    container.addEventListener('click', this.handleClick);

    this.editor.on('file-drop', (e: { type: string; content: string | ArrayBuffer }) => {
      if (e.type.startsWith('image/')) {
        this.editor?.ensureEditorFocus();
        const command = new ImageCommand(this.editor!, e.content as string);
        command.execute();
      }
    });
  }

  /**
   * Обработчик контекстного меню
   */
  private handleContextMenu = (e: MouseEvent): void => {
    const image = (e.target as Element).closest('img');
    if (image instanceof HTMLImageElement) {
      e.preventDefault();
      this.contextMenu?.show(image, e.clientX, e.clientY);
    }
  };

  /**
   * Обработчик клика
   */
  private handleClick = (e: MouseEvent): void => {
    const image = (e.target as Element).closest('img');
    if (image instanceof HTMLImageElement) {
      this.resizer.attachTo(image);
    } else {
      this.resizer.detach();
    }
  };

  private async handleImageUpload(): Promise<void> {
    if (!this.editor) return;

    this.editor?.ensureEditorFocus();

    try {
      const file = await this.uploader.selectFile();
      if (!file) return;

      const dataUrl = await this.uploader.readFileAsDataUrl(file);
      const command = new ImageCommand(this.editor, dataUrl);
      command.execute();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  }

  public destroy(): void {
    const container = this.editor?.getContainer();

    if (container) {
      container.removeEventListener('contextmenu', this.handleContextMenu);
      container.removeEventListener('click', this.handleClick);
    }

    this.editor?.off('image');
    this.editor?.off('file-drop');

    this.contextMenu?.destroy();
    this.contextMenu = null;

    this.resizer.detach();

    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    this.editor = null;
    this.toolbarButton = null;
  }
}
