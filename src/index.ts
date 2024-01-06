import EditorPlugin from "../packages/editor/src";
import ToolbarPlugin from "../packages/toolbar/src";
import SelectionPopupPlugin from "../packages/popup/src";
import './styles.scss';

export class EditorState {
  private content: string = '';

  getContent(): string {
    return this.content;
  }

  setContent(newContent: string): void {
    this.content = newContent;
    // Триггер событий, если необходимо
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
  public toolbar: ToolbarPlugin;
  public popup: SelectionPopupPlugin;
  public editor: EditorPlugin;
  public history: string[] = []

  constructor(appElement: HTMLElement) {
    this.state = new EditorState();
    this.eventManager = new EventManager();
    this.generalElement = appElement;
    this.generalElement.innerHTML = "";

    this.appElement = document.createElement('div');
    this.generalElement.appendChild(this.appElement)
    this.applyStyles();

    this.toolbar = new ToolbarPlugin;
    this.popup = new SelectionPopupPlugin;
    this.editor = new EditorPlugin;
    this.registerModule(this.toolbar);
    this.registerModule(this.popup);
    this.registerModule(this.editor);
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
