import { PopupManager } from '../../../core/ui/PopupManager';
import { ExportService } from '../services/ExportService';
import { htmlIcon, markdownIcon, textIcon, pdfIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class ExportMenu {
  private popup: PopupManager;
  private exportService: ExportService;
  private content: string = '';

  constructor(editor: HTMLEditor) {
    this.popup = new PopupManager(editor, {
      title: editor.t('Export'),
      className: 'example-popup',
      closeOnClickOutside: true,
      items: [
        {
          type: 'button',
          id: 'submit-button',
          value: 'html',
          icon: htmlIcon,
          text: editor.t(`HTML File`),
          buttonVariant: 'primary',
          onChange: (format) => {
            this.exportService.export(this.content, format.toString());
            this.popup.hide();
          },
        },
        {
          type: 'button',
          id: 'submit-button',
          value: 'markdown',
          icon: markdownIcon,
          text: editor.t(`Markdown File`),
          buttonVariant: 'primary',
          onChange: (format) => {
            this.exportService.export(this.content, format.toString());
            this.popup.hide();
          },
        },
        {
          type: 'button',
          id: 'submit-button',
          value: 'text',
          icon: textIcon,
          text: editor.t(`Plain Text`),
          buttonVariant: 'primary',
          onChange: (format) => {
            this.exportService.export(this.content, format.toString());
            this.popup.hide();
          },
        },
        {
          type: 'button',
          id: 'submit-button',
          value: 'pdf',
          icon: pdfIcon,
          text: editor.t(`Print / PDF File`),
          buttonVariant: 'primary',
          onChange: (format) => {
            this.exportService.export(this.content, format.toString());
            this.popup.hide();
          },
        },
      ],
    });
    this.exportService = new ExportService();
  }

  public show(content: string): void {
    this.content = content;
    this.popup.show();
  }

  public destroy(): void {
    // Уничтожаем PopupManager
    if (this.popup) {
      this.popup.destroy(); // Предполагается, что у PopupManager есть метод destroy
    }

    // Очищаем ссылки
    this.popup = null!;
    this.exportService = null!;
    this.content = '';
  }
}
