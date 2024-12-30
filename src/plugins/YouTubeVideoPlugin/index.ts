import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { YouTubeVideoMenu } from './components/YouTubeVideoMenu';
import { YouTubeVideoContextMenu } from './components/YouTubeVideoContextMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { YouTubeVideoCommand } from './commands/YouTubeVideoCommand';
import { youtubeIcon } from '../../icons';
import { ResizableElement } from '../../utils/ResizableElement';

export class YouTubeVideoPlugin implements Plugin {
  name = 'youtube-video';
  private editor: HTMLEditor | null = null;
  private menu: YouTubeVideoMenu | null = null;
  private contextMenu: YouTubeVideoContextMenu | null = null;
  private resizer: ResizableElement;

  constructor() {
    this.resizer = new ResizableElement();
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.menu = new YouTubeVideoMenu(editor);
    this.contextMenu = new YouTubeVideoContextMenu(editor);
    this.addToolbarButton();
    this.setupContextMenu();
    this.setupResizer();
  }

  private setupResizer(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    container.addEventListener('click', (e) => {
      const iframe = (e.target as Element).closest('iframe');
      if (iframe instanceof HTMLIFrameElement && iframe.src.includes('youtube.com')) {
        this.resizer.attachTo(iframe);
      } else {
        this.resizer.detach();
      }
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      const button = createToolbarButton({
        icon: youtubeIcon,
        title: this.editor?.t('Insert YouTube Video'),
        onClick: () => this.openModal(),
      });
      toolbar.appendChild(button);
    }
  }

  private setupContextMenu(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    container.addEventListener('contextmenu', (e) => {
      const iframe = (e.target as Element).closest('iframe');
      if (iframe instanceof HTMLIFrameElement && iframe.src.includes('youtube.com')) {
        e.preventDefault();
        this.contextMenu?.show(iframe, e.clientX, e.clientY);
      }
    });
  }

  private openModal(): void {
    if (!this.editor) return;

    this.menu?.show((videoUrl) => {
      this.editor?.ensureEditorFocus();
      const command = new YouTubeVideoCommand(this.editor!, videoUrl);
      command.execute();
    });
  }

  public destroy(): void {
    // Удаляем обработчики событий
    if (this.editor) {
      const container = this.editor.getContainer();
      container.removeEventListener('click', this.setupResizer);
      container.removeEventListener('contextmenu', this.setupContextMenu);
    }

    // Уничтожаем меню и контекстное меню
    this.menu?.destroy();
    this.contextMenu?.destroy();

    // Отсоединяем ресайзер
    this.resizer.detach();

    // Удаляем кнопку из тулбара
    const toolbar = document.querySelector('.editor-toolbar');
    const button = toolbar?.querySelector(`[title="${this.editor?.t('Insert YouTube Video')}"]`);
    if (button) {
      button.remove();
    }

    // Очищаем ссылки
    this.editor = null;
    this.menu = null;
    this.contextMenu = null;
  }
}
