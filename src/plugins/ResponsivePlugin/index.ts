import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ResponsiveMenu } from './components/ResponsiveMenu';
import { ViewportManager } from './services/ViewportManager';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { responsiveIcon } from '../../icons';

export class ResponsivePlugin implements Plugin {
  name = 'responsive';
  private editor: HTMLEditor | null = null;
  private menu: ResponsiveMenu | null = null;
  private viewportManager: ViewportManager;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.viewportManager = new ViewportManager();
  }

  initialize(editor: HTMLEditor): void {
    this.menu = new ResponsiveMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.setupViewportControls();
    this.editor.on('responsive', () => {
      this.editor?.ensureEditorFocus();
      this.menu?.show();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: responsiveIcon,
      title: this.editor?.t('Responsive View'),
      onClick: () => this.menu?.show(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private setupViewportControls(): void {
    if (!this.editor) return;
    const container = this.editor.getContainer();

    this.menu?.onViewportChange((viewport) => {
      this.viewportManager.setViewport(container, viewport);
    });
  }

  public destroy(): void {
    // Удаляем кнопку из тулбара
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    // Уничтожаем меню
    if (this.menu) {
      this.menu.destroy(); // Предполагается, что у ResponsiveMenu есть метод destroy
      this.menu = null;
    }

    // Отсоединяем обработчики событий
    if (this.editor) {
      this.editor.off('responsive'); // Предполагается, что у HTMLEditor есть метод off
    }

    // Очищаем ссылки
    this.editor = null;
    this.toolbarButton = null;
  }
}
