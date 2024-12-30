import { PopupManager, type PopupItem } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class ErrorModal {
  private popup: PopupManager;

  constructor(editor: HTMLEditor) {
    this.popup = new PopupManager(editor, {
      title: editor.t('Error'),
      className: 'error-modal',
      closeOnClickOutside: true,
      buttons: [
        {
          label: 'OK',
          variant: 'primary',
          onClick: () => this.popup.hide(),
        },
      ],
    });
  }

  public show(message: string): void {
    const items: PopupItem[] = [
      {
        type: 'text',
        id: 'error-message',
        value: message,
      },
    ];

    this.popup.setItems(items);
    this.popup.show();
  }

  public destroy(): void {
    if (this.popup) {
      this.popup.destroy(); // Предполагается, что у PopupManager есть метод destroy
      this.popup = null!; // Очищаем ссылку
    }
  }
}
