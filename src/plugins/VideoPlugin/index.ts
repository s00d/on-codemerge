import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { VideoUploader } from './services/VideoUploader';
import { VideoContextMenu } from './components/VideoContextMenu';
import { ResizableElement } from '../../utils/ResizableElement';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { VideoCommand } from './commands/VideoCommand';
import { videoIcon } from '../../icons';

export class VideoPlugin implements Plugin {
  name = 'video';
  hotkeys = [
    { keys: 'Ctrl+Alt+V', description: 'Insert video', command: 'video', icon: '🎥' },
  ];
  private editor: HTMLEditor | null = null;
  private uploader: VideoUploader;
  private contextMenu: VideoContextMenu | null = null;
  private resizer: ResizableElement;

  constructor() {
    this.uploader = new VideoUploader();
    this.resizer = new ResizableElement();
  }

  initialize(editor: HTMLEditor): void {
    this.contextMenu = new VideoContextMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.setupVideoEvents();
    this.editor.on('video', () => {
      this.handleVideoUpload();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      const button = createToolbarButton({
        icon: videoIcon,
        title: this.editor?.t('Insert Video'),
        onClick: () => this.handleVideoUpload(),
      });
      toolbar.appendChild(button);
    }
  }

  private setupVideoEvents(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    // Context menu
    container.addEventListener('contextmenu', this.handleContextMenu);

    // Resize handles
    container.addEventListener('click', this.handleClick);

    this.editor.on('file-drop', (e: { type: string; content: string | ArrayBuffer }) => {
      if (e.type.startsWith('video/')) {
        this.editor?.ensureEditorFocus();
        const command = new VideoCommand(this.editor!, e.content as string);
        command.execute();
      }
    });
  }

  private handleContextMenu = (e: Event): void => {
    const video = (e.target as Element).closest('video');
    if (video instanceof HTMLVideoElement) {
      e.preventDefault();
      const mouseX = (e as MouseEvent).clientX + window.scrollX;
      const mouseY = (e as MouseEvent).clientY + window.scrollY;

      console.log('Mouse coordinates with scroll:', mouseX, mouseY);

      this.contextMenu?.show(video, mouseX, mouseY);
    }
  };

  private handleClick = (e: Event): void => {
    const video = (e.target as Element).closest('video');
    if (video instanceof HTMLVideoElement) {
      this.resizer.attachTo(video);
    } else {
      this.resizer.detach();
    }
  };

  private async handleVideoUpload(file?: File): Promise<void> {
    if (!this.editor) return;

    this.editor.ensureEditorFocus();

    try {
      const selectedFile = file || (await this.uploader.selectFile());
      if (!selectedFile) return;

      const dataUrl = await this.uploader.readFileAsDataUrl(selectedFile);
      const command = new VideoCommand(this.editor, dataUrl);
      command.execute();
    } catch (error) {
      console.error('Failed to upload video:', error);
    }
  }

  public destroy(): void {
    if (this.editor) {
      const container = this.editor.getContainer();
      container.removeEventListener('contextmenu', this.handleContextMenu);
      container.removeEventListener('click', this.handleClick);
    }

    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    this.editor?.off('video');
    this.editor?.off('file-drop');

    this.resizer.detach();

    this.editor = null;
    this.uploader = null!;
    this.resizer = null!;
  }
}
