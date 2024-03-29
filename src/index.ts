import Toolbar from "./toolbar";
import Editor from "./editor";
import { EditorState } from "./EditorState";
import { EventManager } from "./EventManager";
import type { EditorCoreInterface, Hook, IEditorModule } from "./types";
import Footer from "./footer";
import { I18n } from "./i18n";

export class EditorCore implements EditorCoreInterface {
  public state: EditorState;
  public eventManager: EventManager;
  public modules: IEditorModule[] = [];
  public appElement: HTMLElement;
  public generalElement: HTMLElement;
  public i18n: I18n;
  public toolbar: Toolbar;
  public editor: Editor;
  public footer: Footer;
  public history: string[] = []
  public currentSelectionRange: Range | null = null;


  constructor(appElement: HTMLElement) {
    this.state = new EditorState();
    this.eventManager = new EventManager();
    this.generalElement = appElement;
    this.generalElement.innerHTML = "";

    this.appElement = document.createElement('div');
    this.appElement.classList.add('on-codemerge')
    this.generalElement.appendChild(this.appElement)
    this.applyStyles();

    this.i18n = new I18n(this);
    this.i18n.loadLanguage('en');
    this.toolbar = new Toolbar(this);
    this.editor = new Editor(this);
    this.footer = new Footer(this);

    this.generalElement.addEventListener('keydown', this.handleKeydown);
    this.injectStyles();

    setTimeout(() => {
      this.saveCurrentSelection();
    }, 10);
  }


  private injectStyles(): void {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .editor-block {
        position: relative;
        display: flex;
        min-height: 100px;
      }
      
      .editor-block-section {
        flex: 1;
        padding: 10px;
      }
      
      .editor-block-resizer, .editor-block-height-resizer {
        display: none;
      }
      
      .on-codemerge-icon {
        vertical-align: sub;
      }

      .on-codemerge-button {
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        padding: 5px 10px;
        margin: 5px;
        cursor: pointer;
        white-space: nowrap;
      }
      .on-codemerge-button:hover {
        background-color: #e2e2e2;
        opacity: 0.8;
      }
      .on-codemerge-button.disabled {
        background-color: #ccc;
        border-color: #999;
        cursor: not-allowed;
        opacity: 0.6;
      }
      .on-codemerge svg {
         vertical-align: sub;
      }
      .on-codemerge .editor-block {
         border: 1px solid #ccc;
      }
      .on-codemerge .editor-block-section {
         border: 1px solid #ddd;
      }
      .on-codemerge .editor-block-resizer {
         display: unset;
         width: 1px;
         background: #ccc;
         cursor: col-resize;
         padding: 3px;
      }
      .on-codemerge .editor-block-height-resizer {
         display: unset;
         width: 100%;
         height: 5px;
         background-color: #ccc;
         cursor: ns-resize;
         position: absolute;
         bottom: 0;
         left: 0;
      }
      .on-codemerge-table {
         border-collapse: collapse;
         width: 100%;
      }
      .on-codemerge-table tr th {
         border: 1px solid black;
         padding: 8px;
         background-color: #e1e1e1;
      }
      .on-codemerge-table tr td {
         border: 1px solid black;
         padding: 3px;
         text-align: center;
         position: relative;
      }
      .on-codemerge-table tr td.selected {
         border: 2px solid gray;
         background-color: #e1e1e1;
      }
    `;
    document.head.appendChild(style);
  }

  saveCurrentSelection() {
    const editorElement = this.editor.getEditorElement();
    if (editorElement) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const editorElement = this.editor.getEditorElement();

        let container = range.commonAncestorContainer;
        // Проверяем, находится ли контейнер выделения в пределах редактора
        while (container && container !== editorElement) {
          if (!container.parentNode) {
            return;
          }
          container = container.parentNode;
        }

        // Если контейнер находится в пределах редактора, сохраняем диапазон
        if (container) {
          this.currentSelectionRange = range;
        } else {
          this.currentSelectionRange = null;
        }
      } else {
        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(editorElement); // Выбрать все содержимое
        range.collapse(false); // Коллапсировать Range в конец содержимого

        this.currentSelectionRange = range;

        if(!selection) return;
        // Очистить и установить новое выделение
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  getCurrentSelection() {
    return this.currentSelectionRange;
  }

  restoreCurrentSelection() {
    if (this.currentSelectionRange) {
      const selection = window.getSelection();
      if(!selection) return;
      selection.removeAllRanges();
      selection.addRange(this.currentSelectionRange);
      this.appElement.focus();
    }
  }

  moveCursorToStart() {
    const range = document.createRange();
    const selection = window.getSelection();

    const editor = this.editor.getEditorElement();
    if (selection && editor?.firstChild) {
      range.setStartBefore(editor.firstChild);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  moveCursorToEnd() {
    const range = document.createRange();
    const selection = window.getSelection();

    const editor = this.editor.getEditorElement();
    if (selection && editor?.lastChild) {
      range.selectNodeContents(editor.lastChild); // Выбираем содержимое последнего дочернего элемента
      range.collapse(false); // false означает, что диапазон схлопнется к конечной точке

      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  moveCursorAfterElement(element: HTMLElement|DocumentFragment) {
    const range = document.createRange();
    const selection = window.getSelection();

    if (selection && element.parentNode) {
      range.setStartAfter(element); // Устанавливаем начало диапазона сразу после элемента
      range.collapse(false);

      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  insertHTMLIntoEditor(htmlContent: HTMLElement | DocumentFragment | string): void {
    const editor = this.editor.getEditorElement();
    const currentRange = this.getCurrentSelection();

    // Создаем HTML-элемент, если передана строка
    const html = typeof htmlContent === 'string' ? (() => {
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div;
    })() : htmlContent;

    if (currentRange) {
      currentRange.deleteContents();
      currentRange.insertNode(html);

      // Обновляем диапазон выделения
      const selection = window.getSelection();
      if(selection) {
        selection.removeAllRanges();
        selection.addRange(currentRange);
      }
    } else if (editor) {
      editor.appendChild(html);
    }

    // Обновляем содержимое редактора
    if(editor) this.setContent(editor.innerHTML);
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    const isUndo = (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey;
    const isRedo = (event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey;

    if (isUndo) {
      this.undo();
    } else if (isRedo) {
      this.redo();
    }
  }

  undo() {
    const newContent = this.state.undo();
    this.setContent(this.state.getContent());
    this.eventManager.publish('contentChanged', newContent);
  }

  redo() {
    const newContent = this.state.redo();
    this.setContent(this.state.getContent());
    this.eventManager.publish('contentChanged', newContent);
  }

  isUndo() {
    return this.state.isUndo()
  }

  isRedo() {
    return this.state.isRedo()
  }

  private applyStyles(): void {
    if (this.appElement) {
      this.appElement.style.border = '1px solid #ccc'; // Рамка
      this.appElement.style.minHeight = '140px'; // Высота для 10 строк примерно
      this.appElement.style.resize = 'both'; // Возможность изменять размер
      this.appElement.style.overflow = 'auto'; // Прокрутка при необходимости
      // this.appElement.style.padding = '10px'; // Отступы внутри блока
      this.appElement.style.boxSizing = 'border-box'; // Чтобы размеры включали padding и border
      this.appElement.style.background = '#e9e9e9'; // Чтобы размеры включали padding и border
    }
  }

  registerModule(module: IEditorModule): void {
    this.modules.push(module);
    module.initialize(this);
  }

  // Методы для доступа и изменения контента
  getContent(): string {
    return this.state.getContent();
  }

  setContent(newContent: string): void {
    if (this.state.getContent() !== newContent) {
      this.history.push(newContent);
      this.state.setContent(newContent);
      this.eventManager.publish('contentChanged', newContent);
    }
  }

  contentCleanup(newContent: string): string {
    if (/<[a-z][\s\S]*>/i.test(newContent)) {
      // Если содержит HTML-теги, применяем правила замены
      return newContent
        .replace(/\sid\s*=\s*["']?[^"']*["']?/gi, "")   // Удаляем атрибуты id
        .replace(/<meta\s+charset=["']utf-8["']\s*\/?>/gi, ""); // Удаляем теги meta с указанием кодировки
    } else {
      // Если HTML-теги отсутствуют, возвращаем исходный текст
      return newContent;
    }
  }

  setContentCleanup(newContent: string): void {
    // Отчищаем все атрибуты id из HTML строки
    const cleanedContent = this.contentCleanup(newContent);
    this.setContent(cleanedContent)
  }

  // Методы для работы с событиями
  subscribeToContentChange(callback: Hook): void {
    this.eventManager.subscribe('contentChanged', callback);
  }

  destroy(): void {
    // Удаление всех обработчиков событий
    this.generalElement.removeEventListener('keydown', this.handleKeydown);

    // Уничтожение всех модулей
    this.modules.forEach(module => {
      module.destroy();
    });

    // Удаление элементов интерфейса
    if (this.generalElement) {
      this.generalElement.innerHTML = '';
    }

    this.toolbar.destroy();
    this.editor.destroy();
    this.state.destroy();
    this.eventManager.destroy();
    this.footer.destroy();

    // Очистка ссылок для предотвращения утечек памяти
    // @ts-ignore
    this.state = null;
    // @ts-ignore
    this.eventManager = null;
    this.modules = [];
    // @ts-ignore
    this.appElement = null;
    // @ts-ignore
    this.generalElement = null;
    // @ts-ignore
    this.toolbar = null;
    // @ts-ignore
    this.editor = null;
    // @ts-ignore
    this.footer = null;
    this.history = [];
    this.currentSelectionRange = null;
  }
}

export default EditorCore
