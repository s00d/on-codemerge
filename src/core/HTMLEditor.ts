import { type Plugin, type PluginManager, DefaultPluginManager } from './Plugin';
import { HTMLFormatter } from './services/HTMLFormatter';
import { LocaleManager } from './services/LocaleManager';

type Callback = (...data: any[]) => void;

export class HTMLEditor {
  private innerContainer: HTMLElement;
  private container: HTMLElement;
  private plugins: PluginManager;
  private eventHandlers: Map<string, Callback[]>;
  private formatter: HTMLFormatter;
  private dragOverlay: HTMLElement | null = null;
  private localeManager: LocaleManager;
  private contentChangeCallbacks: Callback[] = [];

  constructor(innerContainer: HTMLElement) {
    // Создаем новый внутренний контейнер
    this.container = document.createElement('div');
    this.container.className = 'html-editor';
    this.container.contentEditable = 'true';
    this.localeManager = new LocaleManager();
    // this.container.draggable = true;

    innerContainer.appendChild(this.container);

    this.innerContainer = innerContainer;

    this.plugins = new DefaultPluginManager();
    this.eventHandlers = new Map();
    this.formatter = new HTMLFormatter();

    this.container.addEventListener('click', () => {
      this.container.focus();
    });

    this.container.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.container.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.container.addEventListener('drop', (e) => this.handleDrop(e));

    this.container.addEventListener('paste', (e) => this.handlePaste(e));

    this.container.addEventListener('input', () => this.handleContentChange());
  }

  private async handlePaste(e: ClipboardEvent): Promise<void> {
    e.preventDefault();

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const files = clipboardData.files;
    const text = clipboardData.getData('text');

    if (files.length > 0) {
      // Обработка файлов
      this.handleFileDrop(files);
    } else if (text) {
      // Обработка текста
      this.handleTextDrop(text);
    }
  }

  private handleDragEnter(e: DragEvent): void {
    e.preventDefault();

    this.dragOverlay = document.createElement('div');
    this.dragOverlay.className = 'drag-overlay';

    this.container.appendChild(this.dragOverlay);
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'; // Указываем, что это копирование
    }
  }

  private handleDragLeave(e: DragEvent): void {
    e.preventDefault();
    if (this.dragOverlay) {
      this.dragOverlay.remove();
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    if (this.dragOverlay) {
      this.dragOverlay.remove();
    }

    if (e.dataTransfer) {
      const files = e.dataTransfer.files;
      const text = e.dataTransfer.getData('text');

      if (files.length > 0) {
        // Обработка файлов
        this.handleFileDrop(files);
      } else if (text) {
        // Обработка текста
        this.handleTextDrop(text);
      }
    }
  }

  private async handleFileDrop(files: FileList): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;
      const fileContent = await this.readFileContent(file);

      // Запускаем событие для каждого файла
      this.triggerEvent('file-drop', { type: fileType, content: fileContent });
    }
  }

  private handleTextDrop(text: string): void {
    this.insertTextAtCursor(text);
    this.triggerEvent('text-drop', text);
  }

  private async readFileContent(file: File): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => reject(reader.error);

      if (file.type.startsWith('text/')) {
        reader.readAsText(file); // Чтение текстовых файлов
      } else {
        reader.readAsDataURL(file); // Чтение бинарных файлов как Data URL
      }
    });
  }

  public insertTextAtCursor(text: string): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false); // Перемещаем курсор в конец вставленного текста
    }
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  public getInnerContainer(): HTMLElement {
    return this.innerContainer;
  }

  public use(plugin: Plugin): void {
    this.plugins.register(plugin);
    plugin.initialize(this);
  }

  public on(eventName: string, callback: Callback): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(callback);
  }

  public triggerEvent(eventName: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach((callback) => callback(...args));
    }
  }

  public off(eventName: string, callback?: Callback): void {
    if (!this.eventHandlers.has(eventName)) {
      return; // Если событие не существует, ничего не делаем
    }

    if (callback) {
      // Удаляем конкретный callback
      const handlers = this.eventHandlers.get(eventName)!;
      const index = handlers.indexOf(callback);
      if (index !== -1) {
        handlers.splice(index, 1); // Удаляем callback из массива
      }

      // Если обработчиков больше нет, удаляем событие из Map
      if (handlers.length === 0) {
        this.eventHandlers.delete(eventName);
      }
    } else {
      // Если callback не передан, удаляем все обработчики для этого события
      this.eventHandlers.delete(eventName);
    }
  }

  /**
   * Обработчик изменений контента
   */
  private handleContentChange(): void {
    const content = this.getHtml();
    this.contentChangeCallbacks.forEach((callback) => callback(content));
  }

  /**
   * Подписка на изменения контента
   * @param callback Функция, которая будет вызвана при изменении контента
   */
  public subscribeToContentChange(callback: Callback): void {
    this.contentChangeCallbacks.push(callback);
  }

  public ensureEditorFocus(): void {
    const container = this.getContainer();

    // Focus the editor
    container.focus();

    // If there's no selection, create one at the start of the editor
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      const range = document.createRange();
      range.selectNodeContents(container);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  public getHtml(): string {
    return this.formatter.format(this.getContainer().innerHTML);
  }

  public setHtml(html: string) {
    this.getContainer().innerHTML = this.formatter.format(html);
  }

  public t(key: string, params: Record<string, string> = {}): string {
    return this.localeManager.translate(key, params);
  }

  public async setLocale(locale: string): Promise<void> {
    return await this.localeManager.setLocale(locale);
  }

  public destroy(): void {
    // Удаляем все обработчики событий
    this.container.removeEventListener('click', () => this.container.focus());
    this.container.removeEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.container.removeEventListener('dragover', (e) => this.handleDragOver(e));
    this.container.removeEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.container.removeEventListener('drop', (e) => this.handleDrop(e));
    this.container.removeEventListener('paste', (e) => this.handlePaste(e));
    this.container.removeEventListener('input', () => this.handleContentChange());

    // Очищаем подписчиков на изменения контента
    this.contentChangeCallbacks = [];

    // Уничтожаем плагины
    this.plugins.destroy();

    // Удаляем контейнер редактора из DOM
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }

    // Очищаем ссылки
    this.innerContainer = null!;
    this.container = null!;
    this.plugins = null!;
    this.eventHandlers = null!;
    this.formatter = null!;
    this.dragOverlay = null;
    this.localeManager = null!;
  }
}
