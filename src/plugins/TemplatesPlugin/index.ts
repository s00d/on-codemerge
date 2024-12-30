import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { TemplatesMenu } from './components/TemplatesMenu';
import { TemplateManager } from './services/TemplateManager';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { templatesIcon } from '../../icons';

export class TemplatesPlugin implements Plugin {
  name = 'templates';
  private editor: HTMLEditor | null = null;
  private menu: TemplatesMenu | null = null;
  private manager: TemplateManager;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.manager = new TemplateManager();
  }

  initialize(editor: HTMLEditor): void {
    this.menu = new TemplatesMenu(this.manager, editor);
    this.editor = editor;
    this.addToolbarButton();
    this.editor.on('templates', () => {
      this.showTemplatesMenu();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: templatesIcon,
      title: this.editor?.t('Templates'),
      onClick: () => this.showTemplatesMenu(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private showTemplatesMenu(): void {
    if (!this.editor) return;
    this.menu?.show((template) => {
      if (this.editor) {
        this.editor.getContainer().innerHTML = template.content;
      }
    });
  }

  public destroy(): void {
    // Удаляем кнопку из тулбара
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    // Уничтожаем меню шаблонов
    if (this.menu) {
      this.menu.destroy(); // Предполагается, что у TemplatesMenu есть метод destroy
      this.menu = null;
    }

    // Отписываемся от событий редактора
    if (this.editor) {
      this.editor.off('templates'); // Предполагается, что у HTMLEditor есть метод off
      this.editor = null;
    }

    // Очищаем ссылки
    this.manager = null!;
    this.toolbarButton = null;
  }
}