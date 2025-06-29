import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { HTMLViewerModal } from './components/HTMLViewerModal';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { htmlIcon } from '../../icons';

export class HTMLViewerPlugin implements Plugin {
  name = 'html-viewer';
  hotkeys = [{ keys: 'Ctrl+Alt+W', description: 'View HTML', command: 'html-viewer', icon: '🖥️' }];
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
    const toolbar = this.editor?.getToolbar();
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
    if (this.modal) {
      this.modal.destroy();
      this.modal = null;
    }

    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
      this.toolbarButton = null;
    }

    this.editor?.off('html-viewer');
    this.editor = null;
  }
}
