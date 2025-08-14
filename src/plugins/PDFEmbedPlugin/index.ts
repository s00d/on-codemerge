import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { PopupManager, type PopupItem } from '../../core/ui/PopupManager';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { pdfIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer';

export class PDFEmbedPlugin implements Plugin {
  name = 'pdf-embed';
  hotkeys = [{ keys: 'Ctrl+Alt+P', description: 'Insert PDF', command: 'pdf-embed', icon: '📄' }];

  private editor: HTMLEditor | null = null;
  private popup: PopupManager | null = null;
  private toolbarButton: HTMLElement | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButton();

    this.popup = new PopupManager(editor, {
      title: editor.t('Insert PDF'),
      className: 'pdf-embed-popup',
      closeOnClickOutside: true,
      items: this.buildPopupItems(),
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup?.hide(),
        },
        { label: editor.t('Insert'), variant: 'primary', onClick: () => this.handleInsert() },
      ],
    });

    this.editor.on('pdf-embed', () => this.openModal());
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: pdfIcon,
        title: this.editor?.t('Insert PDF'),
        onClick: () => this.openModal(),
      });
      toolbar.appendChild(this.toolbarButton);
    }
  }

  private buildPopupItems(): PopupItem[] {
    return [
      {
        type: 'input',
        id: 'pdf-url',
        label: this.editor?.t('PDF URL') || 'PDF URL',
        placeholder: 'https://example.com/file.pdf',
        value: '',
      },
      {
        type: 'number',
        id: 'pdf-width',
        label: this.editor?.t('Width') || 'Width',
        value: 800,
      },
      {
        type: 'number',
        id: 'pdf-height',
        label: this.editor?.t('Height') || 'Height',
        value: 600,
      },
    ];
  }

  private openModal(): void {
    this.popup?.show();
    // Focus URL input
    this.popup?.setFocus('pdf-url');
  }

  private handleInsert(): void {
    if (!this.editor || !this.popup) return;

    const url = String(this.popup.getValue('pdf-url') || '').trim();
    const width = Number(this.popup.getValue('pdf-width') || 800);
    const height = Number(this.popup.getValue('pdf-height') || 600);

    if (!url) {
      this.editor.showWarningNotification(this.editor.t('Please provide PDF URL'));
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-embed-container my-4';
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;

    const iframe = document.createElement('iframe');
    iframe.className = 'pdf-embed-frame';
    iframe.src = url;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('loading', 'lazy');

    wrapper.appendChild(iframe);

    // Add resizer for convenience
    new Resizer(wrapper, {
      handleSize: 10,
      handleColor: '#2563eb',
    });

    this.editor.insertContent(wrapper);
    this.popup.hide();
  }

  destroy(): void {
    // Уничтожаем все UI компоненты
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    // Удаляем кнопку из тулбара
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = null;
    }

    // Отписываемся от всех событий
    this.editor?.off('pdf-embed');
    this.editor?.off('pdf-insert');
    this.editor?.off('pdf-error');

    // Очищаем все ссылки
    this.editor = null;
  }
}
