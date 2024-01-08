import './styles.scss';
import {ContextMenu} from "@root/helpers/contextMenu";
import Toolbar from "@/toolbar";
import Editor from "@/editor";

export class EditorState {
  private content: string = '';
  private history: string[] = [];
  private future: string[] = [];
  private readonly limit = 30;

  getContent(): string {
    return this.content;
  }

  setContent(newContent: string): void {
    this.future = []; // Очистить будущее при каждом новом изменении
    this.history.push(this.content); // Сохраняем текущее состояние в историю

    if (this.history.length > this.limit) {
      this.history.shift(); // Удаляем самый старый элемент, если превышен лимит
    }

    this.content = newContent;
  }

  isUndo() {
    return this.history.length > 0
  }

  isRedo() {
    return this.future.length > 0
  }

  undo(): string {
    if (this.history.length > 0) {
      const state = this.history.pop();
      this.future.push(this.content);

      if (this.future.length > this.limit) {
        this.future.shift(); // Аналогично для массива future
      }

      return this.content = state || '';
    }
    return this.getContent()
  }

  redo(): string {
    if (this.future.length > 0) {
      const state = this.future.pop();
      this.history.push(this.content);

      if (this.history.length > this.limit) {
        this.history.shift(); // Аналогично для массива history
      }

      return this.content = state || '';
    }
    return this.getContent()
  }

  // Другие методы для управления состоянием
}

export class EventManager {
  private listeners: { [event: string]: Function[] } = {};

  subscribe(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  publish(event: string, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Другие методы для управления событиями
}


export interface IEditorModule {
  initialize(core: EditorCore): void;
  // Другие необходимые методы и свойства
}

export class EditorCore {
  public state: EditorState;
  public eventManager: EventManager;
  public modules: IEditorModule[] = [];
  public appElement: HTMLElement;
  public generalElement: HTMLElement;
  public toolbar: Toolbar;
  public popup: ContextMenu;
  public editor: Editor;
  public history: string[] = []
  public currentSelectionRange: Range | null = null;

  constructor(appElement: HTMLElement) {
    this.state = new EditorState();
    this.eventManager = new EventManager();
    this.generalElement = appElement;
    this.generalElement.innerHTML = "";

    this.appElement = document.createElement('div');
    this.generalElement.appendChild(this.appElement)
    this.applyStyles();

    this.toolbar = new Toolbar(this);
    this.popup = new ContextMenu(this);
    this.editor = new Editor(this);

    this.generalElement.addEventListener('keydown', this.handleKeydown);

    this.appElement.addEventListener('mouseup', this.handleTextSelection.bind(this));

    setTimeout(() => {
      this.saveCurrentSelection();
    }, 10);
  }

  private handleTextSelection(event: MouseEvent): void {
    setTimeout(() => {
      const selection = window.getSelection();
      const editorElement = this.editor.getEditorElement();

      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedContent = range.commonAncestorContainer;

        // Проверяем, находится ли выделенный текст внутри редактора
        if (editorElement && editorElement.contains(selectedContent)) {
          // Выделенный текст существует и находится в области редактора
          const rect = range.getBoundingClientRect();
          this.popup.show(rect.x, rect.y + 20);
        } else {
          // Текст выделен вне редактора
          this.popup.hide();
        }
      } else {
        // Текст не выделен
        this.popup.hide();
      }
    }, 10);
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
        // this.currentSelectionRange = null;

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

  moveCursorToStartOfInsertedContent() {
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
  insertHTMLIntoEditor(htmlContent: HTMLElement | string): void {
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
      this.appElement.style.padding = '10px'; // Отступы внутри блока
      this.appElement.style.boxSizing = 'border-box'; // Чтобы размеры включали padding и border
      // Другие необходимые стили...
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

  // Методы для работы с событиями
  subscribeToContentChange(callback: Function): void {
    this.eventManager.subscribe('contentChanged', callback);
  }
}
