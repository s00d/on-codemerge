import type { EditorCoreInterface } from "../types";

export class Editor {
  private editorElement: HTMLDivElement|null = null;
  private savedRange: Range | null = null;
  private core: EditorCoreInterface;

  constructor(core: EditorCoreInterface) {
    this.core = core;
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
    core.subscribeToContentChange((newContent?: string) => {
      if (newContent && this.editorElement?.innerHTML !== newContent) {
        this.editorElement!.innerHTML = newContent;
        this.restoreCaretPosition();
      }
    });

    // Обработчик для обновления содержимого в ядре
    this.editorElement.addEventListener('input', this.handleInput.bind(this));
    this.editorElement.addEventListener('blur', this.handleBlur.bind(this));
    this.editorElement.addEventListener('paste', this.handlePaste.bind(this));
  }

  private handleBlur() {
    this.core.saveCurrentSelection();
  }

  private handleInput() {
    this.saveCaretPosition();
    this.core.setContent(this.editorElement!.innerHTML);
  }

  private handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    this.core.saveCurrentSelection();

    // @ts-ignore
    const clipboardData = event.clipboardData || window.clipboardData;
    let pastedData = clipboardData.getData('text/html');

    // Очистка HTML от атрибутов id
    pastedData = this.core.contentCleanup(pastedData);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pastedData;

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    // Если есть что-то выбрано, сначала удалим выбранное
    if (!selection.isCollapsed) {
      selection.deleteFromDocument();
    }

    // Сохраняем текущее положение курсора
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange();

    while (tempDiv.firstChild) {
      range.insertNode(tempDiv.firstChild);
      range.collapse(false); // Перемещаем курсор в конец только что вставленного узла
    }

    // Обновляем положение курсора в редакторе
    selection.removeAllRanges();
    selection.addRange(range);

    const editor = this.getEditorElement();
    if(editor) this.core.setContent(editor.innerHTML)
  }

  setScreenSize(width: number, height: number): void {
    if (this.editorElement) {
      this.editorElement.style.width = `${width}px`;
      this.editorElement.style.height = `${height}px`;
      this.editorElement.style.margin = `auto`;
    }
  }

  clearScreenSize(): void {
    if (this.editorElement) {
      this.editorElement.style.width = `unset`;
      this.editorElement.style.height = `unset`;
      this.editorElement.style.margin = `unset`;
    }
  }

  private applyStyles(): void {
    if (this.editorElement) {
      this.editorElement.style.border = '1px solid #ccc'; // Рамка
      this.editorElement.style.minHeight = '140px';
      this.editorElement.style.height = 'calc(100% - 20px)'; // Высота для 10 строк примерно
      this.editorElement.style.overflow = 'auto'; // Прокрутка при необходимости
      this.editorElement.style.padding = '10px'; // Отступы внутри блока
      this.editorElement.style.boxSizing = 'border-box'; // Чтобы размеры включали padding и border
      this.editorElement.style.background = 'white'; // Чтобы размеры включали padding и border
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


  destroy(): void {
    // Удаление всех обработчиков событий
    this.editorElement?.removeEventListener('input', this.handleInput);
    this.editorElement?.removeEventListener('blur', this.handleBlur);
    this.editorElement?.removeEventListener('paste', this.handlePaste);

    // Удаление элемента редактора из DOM
    if (this.editorElement && this.editorElement.parentNode) {
      this.editorElement.parentNode.removeChild(this.editorElement);
    }

    // Очистка ссылок для предотвращения утечек памяти
    this.editorElement = null;
    this.savedRange = null;
  }
}

export default Editor;
