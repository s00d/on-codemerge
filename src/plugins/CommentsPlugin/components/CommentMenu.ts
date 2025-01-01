import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createButton, createContainer, createP, createTextarea } from '../../../utils/helpers.ts';

export class CommentMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private callback: ((content: string, action: 'save' | 'delete') => void) | null = null;

  // Ссылки на элементы
  private textarea: HTMLTextAreaElement | null = null;
  private deleteButton: HTMLButtonElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert Comment'),
      className: 'comment-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
        {
          label: editor.t('Save'),
          variant: 'primary',
          onClick: () => this.handleSubmit(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'comment-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    // Основной контейнер
    const container = createContainer('p-4');

    // Текстовое поле для ввода комментария
    this.textarea = createTextarea('Add your comment...');
    this.textarea.className =
      'comment-content w-full h-32 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500';

    // Контейнер для подсказки и кнопки удаления
    const footer = createContainer('flex justify-between items-center mt-4');

    // Подсказка
    const hint = createP(
      'text-sm text-gray-500',
      this.editor.t('Use comments to provide feedback or suggestions.')
    );

    // Кнопка удаления комментария
    this.deleteButton = createButton(this.editor.t('Delete Comment'), () => {
      if (this.callback) {
        this.callback('', 'delete');
        this.popup.hide();
      }
    });
    this.deleteButton.className =
      'delete-comment hidden px-3 py-1.5 text-sm text-red-600 hover:text-red-700 transition-colors';

    // Сборка структуры
    footer.appendChild(hint);
    footer.appendChild(this.deleteButton);
    container.appendChild(this.textarea);
    container.appendChild(footer);

    return container;
  }

  private handleSubmit(): void {
    if (this.textarea && this.callback) {
      const content = this.textarea.value.trim();
      if (content) {
        this.callback(content, 'save');
        this.popup.hide();
      }
    }
  }

  public show(
    callback: (content: string, action: 'save' | 'delete') => void,
    initialContent: string = '',
    showDelete: boolean = false
  ): void {
    this.callback = callback;

    if (this.textarea && this.deleteButton) {
      // Устанавливаем начальные значения
      this.textarea.value = initialContent;
      this.deleteButton.classList.toggle('hidden', !showDelete);

      this.popup.show();
      this.textarea.focus();
    }
  }

  public destroy(): void {
    // Удаляем обработчики событий
    if (this.deleteButton) {
      this.deleteButton.removeEventListener('click', () => {
        if (this.callback) {
          this.callback('', 'delete');
          this.popup.hide();
        }
      });
    }

    // Уничтожаем PopupManager
    this.popup.destroy();

    // Очищаем ссылки
    this.editor = null!;
    this.popup = null!;
    this.callback = null;
    this.textarea = null;
    this.deleteButton = null;
  }
}
