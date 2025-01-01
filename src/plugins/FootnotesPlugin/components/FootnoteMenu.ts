import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createContainer, createP } from '../../../utils/helpers.ts';

export class FootnoteMenu {
  private popup: PopupManager;
  private callback: ((content: string) => void) | null = null;

  // Ссылки на элементы
  private value = '';

  constructor(editor: HTMLEditor) {
    this.popup = new PopupManager(editor, {
      title: editor.t('Add Footnote'),
      className: 'footnote-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
        {
          label: editor.t('Insert'),
          variant: 'primary',
          onClick: () => this.handleSubmit(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'footnote-hint',
          content: () => this.createContent(),
        },
        {
          type: 'textarea',
          id: 'footnote-textarea',
          onChange: (value) => (this.value = value.toString()),
        },
        {
          type: 'text',
          id: 'footnote-text',
          value: editor.t(
            'Add explanatory or reference text that will appear at the bottom of the document'
          ),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    const container = createContainer('p-0');
    const hint = createP('mt-2 text-sm text-gray-500');

    container.appendChild(hint);

    return container;
  }

  private handleSubmit(): void {
    if (this.callback) {
      this.callback(this.value);
      this.popup.hide();
    }
  }

  public show(callback: (content: string) => void, initialContent: string = ''): void {
    this.callback = callback;

    this.popup.setValue('footnote-textarea', initialContent);
    this.popup.show();
    this.popup.setFocus('footnote-textarea');
  }
}
