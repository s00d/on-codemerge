import {EditorCore, IEditorModule} from "@/index";

export class EditorPlugin implements IEditorModule {
  private editorElement: HTMLDivElement|null = null;
  private savedRange: Range | null = null;

  initialize(core: EditorCore): void {
    // Создание и настройка элемента редактора
    this.editorElement = document.createElement('div');
    this.editorElement.classList.add('on-codemerge')
    this.editorElement.contentEditable = 'true';
    this.editorElement.innerText = core.getContent();
    core.appElement.appendChild(this.editorElement);

    this.applyStyles();

    // Подписка на изменения содержимого и обновление интерфейса
    this.editorElement.innerHTML = core.getContent();

    // Подписка на изменения содержимого и обновление интерфейса
    core.subscribeToContentChange((newContent: string) => {
      if (this.editorElement?.innerHTML !== newContent) {
        this.editorElement!.innerHTML = newContent;
        this.restoreCaretPosition();
      }
    });

    // Обработчик для обновления содержимого в ядре
    this.editorElement.addEventListener('input', () => {
      this.saveCaretPosition();
      core.setContent(this.editorElement!.innerHTML);
    });

    this.editorElement.addEventListener('blur', () => {
      core.saveCurrentSelection();
    });
  }

  private applyStyles(): void {
    if (this.editorElement) {
      this.editorElement.style.border = '1px solid #ccc'; // Рамка
      this.editorElement.style.minHeight = '140px';
      this.editorElement.style.height = 'calc(100% - 20px)'; // Высота для 10 строк примерно
      this.editorElement.style.overflow = 'auto'; // Прокрутка при необходимости
      this.editorElement.style.padding = '10px'; // Отступы внутри блока
      this.editorElement.style.boxSizing = 'border-box'; // Чтобы размеры включали padding и border
      // Другие необходимые стили...
    }
  }

  private saveCaretPosition() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedRange = selection.getRangeAt(0);
    }
  }

  private restoreCaretPosition() {
    const selection = window.getSelection();
    if (selection && this.savedRange) {
      selection.removeAllRanges();
      selection.addRange(this.savedRange);
    }
  }

  getEditorElement(): HTMLDivElement|null {
    return this.editorElement;
  }
}

export default EditorPlugin;
