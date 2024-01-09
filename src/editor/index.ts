import type { EditorCore } from "@/index";

export class Editor {
  private editorElement: HTMLDivElement|null = null;
  private savedRange: Range | null = null;

  constructor(core: EditorCore) {
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
    this.editorElement.addEventListener('input', () => {
      this.saveCaretPosition();
      core.setContent(this.editorElement!.innerHTML);
    });

    this.editorElement.addEventListener('blur', () => {
      core.saveCurrentSelection();
    });

    this.editorElement.addEventListener('paste', (event) => {
      this.handlePaste(event, core);
    });
  }

  private handlePaste(event: ClipboardEvent, core: EditorCore) {
    event.preventDefault();
    core.saveCurrentSelection();

    // @ts-ignore
    const clipboardData = event.clipboardData || window.clipboardData;
    let pastedData = clipboardData.getData('text/html');

    // Очистка HTML от атрибутов id
    pastedData = core.contentCleanup(pastedData);

    console.log(pastedData);
    // core.insertHTMLIntoEditor(pastedData)

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
    if(editor) core.setContent(editor.innerHTML)
    // Вставка очищенного HTML
    // document.execCommand('insertHTML', false, pastedData);
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

export default Editor;
