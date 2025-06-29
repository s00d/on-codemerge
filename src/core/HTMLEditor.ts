import { type Plugin, type PluginManager, DefaultPluginManager } from './Plugin';
import { HTMLFormatter } from './services/HTMLFormatter';
import { LocaleManager } from './services/LocaleManager';
import { TextFormatter } from './services/TextFormatter';
import { Selector } from './services/Selector';
import { NotificationManager } from './ui/NotificationManager';
import type { ShortcutCategories } from './types.ts';

type Callback = (...data: any[]) => void;
type ContentCallback = (value: string) => void;

export class HTMLEditor {
  private innerContainer: HTMLElement;
  private container: HTMLElement;
  private plugins: PluginManager;
  private eventHandlers: Map<string, Callback[]>;
  private formatter: HTMLFormatter;
  private localeManager: LocaleManager;
  private contentChangeCallbacks: ContentCallback[] = [];
  private mutationObserver: MutationObserver;
  private textFormatter: TextFormatter | null = null;
  private selector: Selector;
  private _disableObserver = false;
  private notificationManager: NotificationManager;

  constructor(innerContainer: HTMLElement) {
    // Создаем новый внутренний контейнер
    this.container = document.createElement('div');
    this.container.className = 'html-editor';
    this.container.contentEditable = 'true';
    this.localeManager = new LocaleManager();
    this.notificationManager = NotificationManager.getInstance();

    // Инициализируем LocaleManager
    this.localeManager.initialize().catch((error) => {
      console.error('Failed to initialize LocaleManager:', error);
    });

    // this.container.draggable = true;

    innerContainer.appendChild(this.container);

    this.innerContainer = innerContainer;

    this.plugins = new DefaultPluginManager();
    this.eventHandlers = new Map();
    this.formatter = new HTMLFormatter();
    this.textFormatter = new TextFormatter(this.container);
    this.selector = new Selector(this.container);

    this.container.addEventListener('click', (e) => {
      // Проверяем, не кликнули ли мы на блок
      const target = e.target as Element;
      const block = target.closest('.editor-block');

      // Если кликнули на блок, не устанавливаем фокус на контейнер
      if (block) {
        return;
      }

      // Только если кликнули на пустое место, устанавливаем фокус
      this.container.focus();
    });

    this.container.addEventListener('dragstart', (e) => this.handleDragStart(e));
    this.container.addEventListener('dragend', (e) => this.handleDragEnd(e));
    this.container.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.container.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.container.addEventListener('drop', (e) => this.handleDrop(e));

    this.container.addEventListener('paste', (e) => this.handlePaste(e));

    document.addEventListener('selectionchange', (e) => this.handleSelectionChange(e));

    // Инициализация MutationObserver
    this.mutationObserver = new MutationObserver((mutations) => this.handleMutations(mutations));
    this.mutationObserver.observe(this.container, {
      childList: true, // Отслеживаем изменения в дочерних элементах
      subtree: true, // Отслеживаем изменения во всем поддереве
      characterData: true, // Отслеживаем изменения текста
      attributes: true, // Отслеживаем изменения атрибутов
    });
  }

  private async handleSelectionChange(event: Event): Promise<void> {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    // Проверяем, что выделение находится внутри контейнера редактора
    if (this.isSelectionInsideEditor(commonAncestor)) {
      this.triggerEvent('selectionchange', { event });
    }
  }

  /**
   * Проверяет, находится ли выделение внутри контейнера редактора.
   */
  private isSelectionInsideEditor(node: Node): boolean {
    // Если узел является текстовым узлом, проверяем его родительский элемент
    if (node.nodeType === Node.TEXT_NODE) {
      return this.container.contains(node.parentElement);
    }

    // Если узел является элементом, проверяем его напрямую
    if (node.nodeType === Node.ELEMENT_NODE) {
      return this.container.contains(node as HTMLElement);
    }

    // Для других типов узлов (например, комментарии) возвращаем false
    return false;
  }

  private handleMutations(mutations: MutationRecord[]): void {
    const hasContentChanged = mutations.some((mutation) => {
      return (
        mutation.type === 'childList' || // Изменения в дочерних элементах
        mutation.type === 'characterData' || // Изменения в тексте
        mutation.type === 'attributes' // Изменения в атрибутах
      );
    });

    if (hasContentChanged) {
      this.handleContentChange();
    }
  }

  private async handlePaste(e: ClipboardEvent): Promise<void> {
    e.preventDefault();

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const files = clipboardData.files;
    const text = clipboardData.getData('text');

    if (files.length > 0) {
      // Обработка файлов
      this.handleFileDrop(files, e);
    } else if (text) {
      // Обработка текста
      this.handleTextDrop(text);
    }
  }

  private handleDragStart(e: DragEvent): void {
    this.triggerEvent('drag-start', { e });
  }

  private handleDragEnd(e: DragEvent): void {
    this.triggerEvent('drag-end', { e });
  }

  private handleDragEnter(e: DragEvent): void {
    e.preventDefault();

    this.container.classList.add('drag-overlay');
    this.container.draggable = true;

    this.triggerEvent('drag-enter', { e });
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'; // Указываем, что это копирование
    }

    this.triggerEvent('drag-over', { e });
  }

  private handleDragLeave(e: DragEvent): void {
    e.preventDefault();

    this.container.classList.remove('drag-overlay');
    this.container.draggable = false;

    this.triggerEvent('drag-leave', { e });
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();

    this.container.classList.remove('drag-overlay');
    this.container.draggable = false;

    if (e.dataTransfer) {
      const files = e.dataTransfer.files;
      const text = e.dataTransfer.getData('text');

      if (files.length > 0) {
        // Обработка файлов
        this.handleFileDrop(files, e);
      } else if (text) {
        // Обработка текста
        this.handleTextDrop(text);
      }
    }

    this.triggerEvent('drag-drop', { e });
  }

  private async handleFileDrop(files: FileList, e: ClipboardEvent | DragEvent): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;
      const fileName = file.name; // Извлекаем имя файла
      const fileContent = await this.readFileContent(file);

      // Запускаем событие для каждого файла, включая имя файла
      this.triggerEvent('file-drop', { type: fileType, name: fileName, content: fileContent, e });
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

  public getTextFormatter(): TextFormatter | null {
    return this.textFormatter;
  }

  public getSelector(): Selector | null {
    return this.selector;
  }

  public getToolbar(): HTMLElement | null {
    const toolbarPlugin = this.plugins.getPlugin('toolbar');
    if (toolbarPlugin && 'getToolbar' in toolbarPlugin) {
      return (toolbarPlugin as any).getToolbar();
    }
    return null;
  }

  private isSelectionInsideContainer(selection: Selection): boolean {
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    return (
      this.container.contains(range.startContainer) && this.container.contains(range.endContainer)
    );
  }

  private getSelectionInsideContainer(): Selection | null {
    const selection = window.getSelection();
    return selection && this.isSelectionInsideContainer(selection) ? selection : null;
  }

  public saveCursorPosition(): { offset: number } | null {
    const selection = this.getSelectionInsideContainer();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(this.container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const offset = preSelectionRange.toString().length;
    return { offset };
  }

  public restoreCursorPosition(position: { offset: number }): void {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let node: Node = this.container;
    let offset = position.offset;

    // Ищем узел и смещение для восстановления позиции курсора
    const walker = document.createTreeWalker(this.container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text;
      if (offset <= textNode.length) {
        node = textNode;
        break;
      }
      offset -= textNode.length;
    }

    // Если узел не текстовый или смещение выходит за пределы, корректируем позицию
    if (node.nodeType !== Node.TEXT_NODE || offset < 0 || offset > (node as Text).length) {
      // Если смещение выходит за пределы, устанавливаем курсор в конец контейнера
      node = this.container;
      offset = this.container.childNodes.length;
    }

    range.setStart(node, offset);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    this.container.focus();
  }

  public use(plugin: Plugin): void {
    this.plugins.register(plugin);
    plugin.initialize(this);
  }

  public getPlugins(): Map<string, Plugin> {
    return this.plugins.getPlugins();
  }

  public getHotkeys(): ShortcutCategories {
    return this.plugins.getHotkeys();
  }

  public on(eventName: string, callback: Callback): () => void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(callback);

    // Возвращаем функцию для отписки
    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index !== -1) {
          handlers.splice(index, 1); // Удаляем callback из массива
        }

        // Если обработчиков больше нет, удаляем событие из Map
        if (handlers.length === 0) {
          this.eventHandlers.delete(eventName);
        }
      }
    };
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

  disableObserver() {
    this._disableObserver = true;
  }

  enableObserver() {
    this._disableObserver = false;
  }

  /**
   * Обработчик изменений контента
   */
  private handleContentChange(): void {
    if (this._disableObserver) return;
    const content = this.getHtml();
    this.contentChangeCallbacks.forEach((callback) => callback(content));
  }

  /**
   * Подписка на изменения контента
   * @param callback Функция, которая будет вызвана при изменении контента
   */
  public subscribeToContentChange(callback: ContentCallback): () => void {
    this.contentChangeCallbacks.push(callback);

    // Возвращаем функцию для отписки
    return () => {
      const index = this.contentChangeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.contentChangeCallbacks.splice(index, 1);
      }
    };
  }

  public ensureEditorFocus(): void {
    const container = this.getContainer();

    // Проверяем, есть ли уже активное выделение
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Если выделение уже внутри редактора, не трогаем его
      if (this.isSelectionInsideEditor(range.commonAncestorContainer)) {
        return;
      }
    }

    // Focus the editor only if no valid selection exists
    container.focus();

    // If there's no selection, create one at the start of the editor
    if (!selection || !selection.rangeCount) {
      const range = document.createRange();
      range.selectNodeContents(container);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  public getHtml(): string {
    // Получаем контейнер
    const container = this.getContainer();
    if (!container) return '';

    // Клонируем контейнер, чтобы не изменять оригинальный DOM
    const clonedContainer = container.cloneNode(true) as HTMLElement;

    // Получаем HTML с замененными canvas
    const htmlContent = clonedContainer.innerHTML;

    // Форматируем HTML с помощью formatter (если он есть)
    return this.formatter.format(htmlContent);
  }

  private waitForDOMStabilization(container: HTMLElement, timeout = 100): Promise<void> {
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      const observer = new MutationObserver(() => {
        // Сбрасываем таймер при каждом изменении DOM
        clearTimeout(timer);
        timer = setTimeout(() => {
          // Если изменений не было в течение `timeout` мс, завершаем наблюдение
          observer.disconnect();
          resolve();
        }, timeout);
      });

      // Начинаем наблюдение за изменениями в контейнере
      observer.observe(container, {
        childList: true, // Отслеживаем изменения в дочерних элементах
        subtree: true, // Отслеживаем изменения во всем поддереве
        attributes: true, // Отслеживаем изменения атрибутов
        characterData: true, // Отслеживаем изменения текста
      });

      // Запускаем таймер при первом вызове
      timer = setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);
    });
  }

  public async setHtml(html: string): Promise<void> {
    // Ждем, пока DOM стабилизируется
    await this.waitForDOMStabilization(this.container);
    // Устанавливаем новый HTML
    this.container.innerHTML = this.formatter.format(html);
    // Убеждаемся, что браузер завершил рендеринг
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  public insertContent(content: string | HTMLElement | DocumentFragment): void {
    this.ensureEditorFocus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents(); // Удаляем текущее выделение, если оно есть

      // Если content — это строка, вставляем её как HTML
      if (typeof content === 'string') {
        const div = document.createElement('div'); // Создаем временный контейнер
        div.innerHTML = content; // Вставляем HTML в контейнер

        // Вставляем все дочерние элементы из временного контейнера
        while (div.firstChild) {
          range.insertNode(div.firstChild);
        }
      } else {
        // Если content — это HTMLElement, вставляем его
        range.insertNode(content);
      }

      // Перемещаем курсор в конец вставленного контента
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Если курсор не активен, вставляем контент в конец редактора
      const container = this.getContainer();
      if (typeof content === 'string') {
        container.insertAdjacentHTML('beforeend', content);
      } else {
        container.appendChild(content);
      }
    }
  }

  public t(key: string, params: Record<string, string> = {}): string {
    // Если LocaleManager еще не готов, возвращаем ключ
    if (!this.localeManager.isReady()) {
      return key;
    }
    return this.localeManager.translate(key, params);
  }

  public async setLocale(locale: string): Promise<void> {
    return await this.localeManager.setLocale(locale);
  }

  public getLocale(): string {
    return this.localeManager.getCurrentLocale();
  }

  // Notification methods
  public showNotification(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 3000
  ): void {
    this.notificationManager.show({ message, type, duration });
  }

  public showSuccessNotification(message: string, duration?: number): void {
    this.notificationManager.success(message, { duration });
  }

  public showErrorNotification(message: string, duration?: number): void {
    this.notificationManager.error(message, { duration });
  }

  public showWarningNotification(message: string, duration?: number): void {
    this.notificationManager.warning(message, { duration });
  }

  public showInfoNotification(message: string, duration?: number): void {
    this.notificationManager.info(message, { duration });
  }

  public destroy(): void {
    this.mutationObserver.disconnect();

    // Удаляем все обработчики событий
    this.container.removeEventListener('click', (e) => {
      // Проверяем, не кликнули ли мы на блок
      const target = e.target as Element;
      const block = target.closest('.editor-block');

      // Если кликнули на блок, не устанавливаем фокус на контейнер
      if (block) {
        return;
      }

      // Только если кликнули на пустое место, устанавливаем фокус
      this.container.focus();
    });
    this.container.removeEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.container.removeEventListener('dragover', (e) => this.handleDragOver(e));
    this.container.removeEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.container.removeEventListener('drop', (e) => this.handleDrop(e));
    this.container.removeEventListener('paste', (e) => this.handlePaste(e));

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
    this.localeManager = null!;
    this.mutationObserver = null!;
    this.textFormatter = null!;
  }
}
