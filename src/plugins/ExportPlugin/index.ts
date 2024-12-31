import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ExportMenu } from './components/ExportMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { exportIcon } from '../../icons';

export class ExportPlugin implements Plugin {
  name = 'export';
  private editor: HTMLEditor | null = null;
  private menu: ExportMenu | null = null;
  private toolbarButton: HTMLElement | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.menu = new ExportMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.editor.on('export', () => {
      this.showExportMenu();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: exportIcon,
      title: this.editor?.t('Export') ?? '',
      onClick: () => this.showExportMenu(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private showExportMenu(): void {
    if (!this.editor) return;
    const content = this.editor.getContainer().innerHTML;
    this.menu?.show(content);
  }

  public destroy(): void {
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }

    this.editor?.off('export');
    this.editor = null;

    this.toolbarButton = null;
  }
}
