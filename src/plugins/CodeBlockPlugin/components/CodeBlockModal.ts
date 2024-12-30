import { PopupManager } from '../../../core/ui/PopupManager';
import { SUPPORTED_LANGUAGES } from '../constants';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class CodeBlockModal {
  private popup: PopupManager;
  private callback: ((code: string, language: string) => void) | null = null;
  private languageSelect = '';
  private codeInput = 'plaintext';

  constructor(editor: HTMLEditor) {
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert Code Block'),
      className: 'code-block-modal',
      closeOnClickOutside: true,
      items: [
        {
          type: 'list',
          label: editor.t('Language'),
          id: 'language',
          options: SUPPORTED_LANGUAGES,
          value: this.codeInput,
          onChange: (value) => (this.languageSelect = value.toString()),
        },
        {
          type: 'textarea',
          label: 'Code',
          id: 'code',
          placeholder: editor.t('Enter your code here...'),
          onChange: (value) => (this.codeInput = value.toString()),
        },
      ],
      buttons: [
        {
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
        {
          label: 'Save',
          variant: 'primary',
          onClick: () => this.handleSubmit(),
        },
      ],
    });
  }

  private handleSubmit(): void {
    const language = this.languageSelect;
    const code = this.codeInput.trim();

    if (code && this.callback) {
      this.callback(code, language);
      this.popup.hide();
    }
  }

  public show(
    callback: (code: string, language: string) => void,
    initialCode: string = '',
    initialLanguage: string = 'plaintext'
  ): void {
    this.callback = callback;

    this.popup.setValue('language', initialLanguage);
    this.popup.setValue('code', initialCode);

    this.popup.show();

    this.popup.setFocus('code');
  }

  public destroy(): void {
    // Уничтожаем попап
    this.popup.destroy();

    // Очищаем callback
    this.callback = null;

    // Очищаем остальные ссылки
    this.popup = null!;
  }
}
