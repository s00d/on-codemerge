import { PopupManager } from '../../../core/ui/PopupManager';
import { HTMLHighlighter } from '../services/HTMLHighlighter';
import { copyIcon, saveIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import {
  createButton,
  createCode,
  createContainer,
  createPre,
  createTextarea,
} from '../../../utils/helpers.ts';

export class HTMLViewerModal {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private highlighter: HTMLHighlighter;

  // Ссылки на элементы
  private codeElement: HTMLElement | null = null;
  private editElement: HTMLTextAreaElement | null = null;
  private copyButton: HTMLElement | null = null;
  private saveButton: HTMLElement | null = null;
  private tabs: HTMLElement | null = null;
  private viewTab: HTMLElement | null = null;
  private editTab: HTMLElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      className: 'html-viewer-modal',
      closeOnClickOutside: true,
      items: [
        {
          type: 'custom',
          id: 'html-viewer-content',
          content: () => this.createContent(),
        },
      ],
    });
    this.highlighter = new HTMLHighlighter();
  }

  private createContent(): HTMLElement {
    // Основной контейнер
    const container = createContainer();
    const header = createContainer('modal-header');
    const title = createContainer('text-lg font-semibold', this.editor.t('HTML Source'));
    title.textContent = this.editor.t('HTML Source');

    this.copyButton = createButton('', () => {
      if (this.codeElement) {
        navigator.clipboard.writeText(this.codeElement.textContent || '');

        // Показываем обратную связь
        const originalText = this.copyButton!.innerHTML;
        this.copyButton!.innerHTML = this.editor.t('Copied!');
        setTimeout(() => {
          this.copyButton!.innerHTML = originalText;
        }, 2000);
      }
    });
    this.copyButton.className = 'copy-button';
    this.copyButton.innerHTML = `${copyIcon} ` + this.editor.t('Copy');

    this.saveButton = createButton('', () => {
      if (this.editElement) {
        const newHtml = this.editElement.value;
        this.codeElement!.textContent = newHtml;
        this.highlighter.highlight(this.codeElement!);
        this.editor?.setHtml(newHtml);
        this.switchTab('view');
      }
    });
    this.saveButton.className = 'save-button';
    this.saveButton.innerHTML = `${saveIcon} ` + this.editor.t('Save');
    this.saveButton.style.display = 'none'; // Скрываем кнопку Save по умолчанию

    header.appendChild(title);
    header.appendChild(this.copyButton);
    header.appendChild(this.saveButton);

    // Вкладки
    this.tabs = createContainer('tabs');

    this.viewTab = createButton(this.editor.t('View'), () => {
      this.switchTab('view');
    });
    this.viewTab.className = 'tab active';

    this.editTab = createButton(this.editor.t('Edit'), () => {
      this.switchTab('edit');
    });
    this.editTab.className = 'tab';

    this.tabs.appendChild(this.viewTab);
    this.tabs.appendChild(this.editTab);

    // Тело модального окна
    const body = createContainer('modal-body');
    const viewContainer = createContainer('view-container');
    const pre = createPre();
    this.codeElement = createCode('html-content');

    pre.appendChild(this.codeElement);
    viewContainer.appendChild(pre);

    // Контейнер для редактирования HTML
    const editContainer = createContainer('edit-container');
    editContainer.style.display = 'none'; // Скрываем контейнер редактирования по умолчанию

    this.editElement = createTextarea();
    this.editElement.className = 'html-edit w-full border border-gray-300 rounded-lg p-2';
    this.editElement.rows = 10;

    editContainer.appendChild(this.editElement);

    // Сборка структуры
    body.appendChild(viewContainer);
    body.appendChild(editContainer);

    // Сборка структуры
    container.appendChild(header);
    container.appendChild(this.tabs);
    container.appendChild(body);

    return container;
  }

  private switchTab(tab: 'view' | 'edit'): void {
    if (tab === 'view') {
      this.viewTab?.classList.add('active');
      this.editTab?.classList.remove('active');
      (this.popup.getElement().querySelector('.view-container')! as HTMLElement).style.display =
        'block';
      (this.popup.getElement().querySelector('.edit-container')! as HTMLElement).style.display =
        'none';
      this.copyButton!.style.display = 'flex';
      this.saveButton!.style.display = 'none';
    } else if (tab === 'edit') {
      this.viewTab?.classList.remove('active');
      this.editTab?.classList.add('active');
      (this.popup.getElement().querySelector('.view-container')! as HTMLElement).style.display =
        'none';
      (this.popup.getElement().querySelector('.edit-container')! as HTMLElement).style.display =
        'block';
      this.copyButton!.style.display = 'none';
      this.saveButton!.style.display = 'flex';

      if (this.editElement && this.codeElement) {
        this.editElement.value = this.codeElement.textContent || '';
      }
    }
  }

  public show(html: string): void {
    if (this.codeElement) {
      this.codeElement.textContent = html;
      this.highlighter.highlight(this.codeElement);
    }
    this.popup.show();
  }

  public hide(): void {
    this.popup.hide();
  }

  public destroy(): void {
    // Закрываем модальное окно
    this.hide();

    // Удаляем обработчики событий
    if (this.viewTab) {
      this.viewTab.removeEventListener('click', () => this.switchTab('view'));
    }
    if (this.editTab) {
      this.editTab.removeEventListener('click', () => this.switchTab('edit'));
    }
    if (this.copyButton) {
      this.copyButton.removeEventListener('click', () => {});
    }
    if (this.saveButton) {
      this.saveButton.removeEventListener('click', () => {});
    }

    // Очищаем ссылки на элементы
    this.codeElement = null;
    this.editElement = null;
    this.copyButton = null;
    this.saveButton = null;
    this.tabs = null;
    this.viewTab = null;
    this.editTab = null;

    // Уничтожаем PopupManager и Highlighter
    this.popup.destroy?.();
    this.highlighter = null!;
  }
}
