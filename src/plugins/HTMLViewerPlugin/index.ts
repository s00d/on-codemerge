import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { HTMLViewerModal } from './components/HTMLViewerModal';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { htmlIcon } from '../../icons';

export class HTMLViewerPlugin implements Plugin {
  name = 'html-viewer';
  private editor: HTMLEditor | null = null;
  private modal: HTMLViewerModal | null = null;
  private toolbarButton: HTMLElement | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.modal = new HTMLViewerModal(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.editor.on('html-viewer', () => {
      this.showHTML();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: htmlIcon,
      title: this.editor?.t('View HTML') ?? '',
      onClick: () => this.showHTML(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private showHTML(): void {
    if (!this.editor) return;
    this.modal?.show(this.editor.getHtml());
  }

  public destroy(): void {
    // Удаляем модальное окно
    if (this.modal) {
      this.modal.destroy(); // Предполагается, что у HTMLViewerModal есть метод destroy
      this.modal = null;
    }

    // Удаляем кнопку из тулбара
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
      this.toolbarButton = null;
    }

    // Отписываемся от событий
    if (this.editor) {
      this.editor.off('html-viewer'); // Предполагается, что у HTMLEditor есть метод off
      this.editor = null;
    }
  }
}
