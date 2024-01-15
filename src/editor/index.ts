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

    this.applyStyles(this.editorElement, {
      border: '1px solid #ccc', // Рамка
      minHeight: '140px',
      height: 'calc(100% - 20px)', // Высота для 10 строк примерно
      overflow: 'auto', // Прокрутка при необходимости
      padding: '10px', // Отступы внутри блока
      boxSizing: 'border-box', // Чтобы размеры включали padding и border
      background: 'white', // Чтобы размеры включали padding и border
    });

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

    this.editorElement.addEventListener('dragover', this.handleDragOver.bind(this));
    this.editorElement.addEventListener('drop', this.handleDrop.bind(this));
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.add('drag-over'); // Add a class to highlight the border
    this.applyStyles(event.currentTarget as HTMLElement, {
      backgroundColor: '#f0f0f0', // Slightly gray background
      border: '2px dotted #000',    // Dotted border
      padding: '10px'              // Padding around the border
    });
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.applyStyles(event.currentTarget as HTMLElement, {
      backgroundColor: 'white',
      border: 'unset',
      padding: 'unset'
    });
    console.log(event.currentTarget);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.readFile(file);
    }
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const fileContent = reader.result as string;
      const isImage = file.type.startsWith('image/');
      this.core?.eventManager.publish('fileDrop', { fileName: file.name, fileContent, isImage });
    };
    reader.readAsDataURL(file);
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
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

    if (!pastedData) {
      pastedData = clipboardData.getData('text/plain');
    }

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
