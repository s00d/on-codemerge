import { type Plugin, type PluginManager, DefaultPluginManager } from './Plugin';
import { HTMLFormatter } from './services/HTMLFormatter';
import { LocaleManager } from './services/LocaleManager';
import { TextFormatter } from './services/TextFormatter';
import { Selector } from './services/Selector';
import { NotificationManager } from './ui/NotificationManager';
import { DOMContext } from './DOMContext';
import type { ShortcutCategories } from './types.ts';

type Callback = (...data: any[]) => void;
type ContentCallback = (value: string) => void;

export interface EditorOptions {
  mode: 'direct' | 'shadowRoot' | 'iframe';
  shadowRoot?: ShadowRoot;
  iframe?: HTMLIFrameElement;
}

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
  private boundHandleSelectionChange?: (e: Event) => void;
  private boundClickToFocus?: (e: MouseEvent) => void;
  private boundDragStart?: (e: DragEvent) => void;
  private boundDragEnd?: (e: DragEvent) => void;
  private boundDragEnter?: (e: DragEvent) => void;
  private boundDragOver?: (e: DragEvent) => void;
  private boundDragLeave?: (e: DragEvent) => void;
  private boundDrop?: (e: DragEvent) => void;
  private boundPaste?: (e: ClipboardEvent) => void;
  private domContext: DOMContext;
  private options: EditorOptions;

  constructor(innerContainer: HTMLElement, options: EditorOptions = { mode: 'direct' }) {
    this.options = options;

    // Инициализируем DOMContext
    this.domContext = new DOMContext(options.shadowRoot || undefined, options.iframe || undefined);

    // Обрабатываем разные режимы
    let actualContainer = innerContainer;

    if (options.mode === 'shadowRoot') {
      actualContainer = this.setupShadowRootMode(innerContainer);
    } else if (options.mode === 'iframe') {
      actualContainer = this.setupIframeMode(innerContainer);
    }

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

    actualContainer.appendChild(this.container);

    this.innerContainer = innerContainer;

    this.plugins = new DefaultPluginManager();
    this.eventHandlers = new Map();
    this.formatter = new HTMLFormatter();
    this.textFormatter = new TextFormatter(this.container, options.shadowRoot || undefined);
    this.selector = new Selector(this.container);

    this.boundClickToFocus = (e: MouseEvent) => {
      const target = e.target as Element;
      const block = target.closest('.editor-block');
      if (block) return;
      this.container.focus();
    };
    this.boundDragStart = (e: DragEvent) => this.handleDragStart(e);
    this.boundDragEnd = (e: DragEvent) => this.handleDragEnd(e);
    this.boundDragEnter = (e: DragEvent) => this.handleDragEnter(e);
    this.boundDragOver = (e: DragEvent) => this.handleDragOver(e);
    this.boundDragLeave = (e: DragEvent) => this.handleDragLeave(e);
    this.boundDrop = (e: DragEvent) => this.handleDrop(e);
    this.boundPaste = (e: ClipboardEvent) => this.handlePaste(e);

    this.container.addEventListener('click', this.boundClickToFocus);
    this.container.addEventListener('dragstart', this.boundDragStart);
    this.container.addEventListener('dragend', this.boundDragEnd);
    this.container.addEventListener('dragenter', this.boundDragEnter);
    this.container.addEventListener('dragover', this.boundDragOver);
    this.container.addEventListener('dragleave', this.boundDragLeave);
    this.container.addEventListener('drop', this.boundDrop);

    this.container.addEventListener('paste', this.boundPaste);

    this.boundHandleSelectionChange = (e: Event) => this.handleSelectionChange(e);
    this.domContext.addEventListener('selectionchange', this.boundHandleSelectionChange);

    // Инициализация MutationObserver
    this.mutationObserver = new MutationObserver((mutations) => this.handleMutations(mutations));
    this.mutationObserver.observe(this.container, {
      childList: true, // Отслеживаем изменения в дочерних элементах
      subtree: true, // Отслеживаем изменения во всем поддереве
      characterData: true, // Отслеживаем изменения текста
      attributes: true, // Отслеживаем изменения атрибутов
    });
  }

  // Применение стилей к Shadow DOM
  private applyStylesToShadowDOM(shadowRoot: ShadowRoot): void {
    try {
      // Пробуем использовать adoptedStyleSheets (современный способ)
      if (document.adoptedStyleSheets && document.adoptedStyleSheets.length > 0) {
        shadowRoot.adoptedStyleSheets = Array.from(document.adoptedStyleSheets);
      } else {
        // Fallback: копируем стили как раньше
        const styleElements = document.querySelectorAll('style');
        styleElements.forEach((style, _index) => {
          const newStyle = document.createElement('style');
          newStyle.textContent = style.textContent || '';
          shadowRoot.appendChild(newStyle);
        });
      }
    } catch (error) {
      // Fallback: копируем стили
      const styleElements = document.querySelectorAll('style');
      styleElements.forEach((style, _index) => {
        const newStyle = document.createElement('style');
        newStyle.textContent = style.textContent || '';
        shadowRoot.appendChild(newStyle);
      });
    }
  }

  // Применение стилей к iframe
  private applyStylesToIframe(iframeDocument: Document): void {
    try {
      // Копируем все стили из основного документа в iframe
      const styleElements = document.querySelectorAll('style');
      styleElements.forEach((style) => {
        const newStyle = iframeDocument.createElement('style');
        newStyle.textContent = style.textContent || '';
        iframeDocument.head.appendChild(newStyle);
      });

      // Копируем link элементы со стилями
      const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach((link) => {
        const newLink = iframeDocument.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = (link as HTMLLinkElement).href;
        iframeDocument.head.appendChild(newLink);
      });

      // Пробуем использовать adoptedStyleSheets если поддерживается
      if (document.adoptedStyleSheets && iframeDocument.adoptedStyleSheets) {
        iframeDocument.adoptedStyleSheets = Array.from(document.adoptedStyleSheets);
      }
    } catch (error) {
      console.warn('Failed to apply styles to iframe:', error);
    }
  }

  private setupShadowRootMode(innerContainer: HTMLElement): HTMLElement {
    if (this.options.shadowRoot) {
      // Используем переданный shadowRoot
      this.applyStylesToShadowDOM(this.options.shadowRoot);
      return innerContainer;
    } else {
      // Создаем новый shadowRoot
      const shadowRoot = innerContainer.attachShadow({ mode: 'open' });
      this.options.shadowRoot = shadowRoot;
      this.domContext = new DOMContext(shadowRoot);
      this.applyStylesToShadowDOM(shadowRoot);

      // Создаем контейнер внутри shadowRoot
      const shadowContainer = document.createElement('div');
      shadowContainer.className = 'shadow-editor-container';
      shadowRoot.appendChild(shadowContainer);
      return shadowContainer;
    }
  }

  private setupIframeMode(innerContainer: HTMLElement): HTMLElement {
    if (this.options.iframe) {
      // Используем переданный iframe
      if (this.options.iframe.contentDocument?.body) {
        return this.options.iframe.contentDocument.body;
      }
      // Если iframe еще не загружен, возвращаем innerContainer
      return innerContainer;
    } else {
      // Создаем новый iframe
      const iframe = document.createElement('iframe');
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.minHeight = '500px'; // Минимальная высота
      iframe.style.display = 'block';
      iframe.style.overflow = 'hidden';
      innerContainer.appendChild(iframe);

      // Создаем Promise для ожидания загрузки iframe
      const iframeReady = new Promise<void>((resolve) => {
        iframe.onload = () => {
          if (iframe.contentDocument) {
            iframe.contentDocument.body.style.margin = '0';
            iframe.contentDocument.body.style.padding = '0';
            iframe.contentDocument.body.style.minHeight = '100vh'; // Минимальная высота на весь экран
            iframe.contentDocument.body.style.height = '100%';
            iframe.contentDocument.body.style.width = '100%';
            iframe.contentDocument.body.style.overflow = 'auto';

            // Копируем стили внутрь iframe
            this.applyStylesToIframe(iframe.contentDocument);

            // Перемещаем редактор внутрь iframe
            if (this.container.parentElement) {
              iframe.contentDocument.body.appendChild(this.container);
            }

            // Обновляем DOMContext для работы с iframe
            this.domContext = new DOMContext(undefined, iframe);

            resolve();
          }
        };
      });

      // Сохраняем Promise для использования в будущем
      (this as any).iframeReady = iframeReady;

      this.options.iframe = iframe;
      return innerContainer; // Временно возвращаем innerContainer
    }
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

  public getDOMContext(): DOMContext {
    return this.domContext;
  }

  public getMode(): string {
    return this.options.mode;
  }

  public getShadowRoot(): ShadowRoot | undefined {
    return this.options.shadowRoot;
  }

  public getIframe(): HTMLIFrameElement | undefined {
    return this.options.iframe;
  }

  /**
   * Adds CSS styles depending on the editor's operating mode
   * @param styles - CSS strings or CSS object
   */
  public addStyle(cssString: string): void {
    if (this.options.mode === 'direct') {
      // In direct mode, add styles to head
      const styleElement = document.createElement('style');
      styleElement.textContent = cssString;
      document.head.appendChild(styleElement);
    } else if (this.options.shadowRoot) {
      // In Shadow DOM mode, add styles to shadowRoot
      const styleElement = document.createElement('style');
      styleElement.textContent = cssString;
      this.options.shadowRoot.appendChild(styleElement);
    } else if (this.options.iframe?.contentDocument) {
      // In iframe mode, add styles to iframe
      const styleElement = this.options.iframe.contentDocument.createElement('style');
      styleElement.textContent = cssString;
      this.options.iframe.contentDocument.head.appendChild(styleElement);
    }
  }

  /**
   * Ожидает готовности iframe (только для iframe режима)
   */
  public async waitForIframeReady(): Promise<void> {
    if (this.options.mode === 'iframe' && (this as any).iframeReady) {
      await (this as any).iframeReady;
    }
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
    if (this.boundClickToFocus) this.container.removeEventListener('click', this.boundClickToFocus);
    if (this.boundDragStart) this.container.removeEventListener('dragstart', this.boundDragStart);
    if (this.boundDragEnd) this.container.removeEventListener('dragend', this.boundDragEnd);
    if (this.boundDragEnter) this.container.removeEventListener('dragenter', this.boundDragEnter);
    if (this.boundDragOver) this.container.removeEventListener('dragover', this.boundDragOver);
    if (this.boundDragLeave) this.container.removeEventListener('dragleave', this.boundDragLeave);
    if (this.boundDrop) this.container.removeEventListener('drop', this.boundDrop);
    if (this.boundPaste) this.container.removeEventListener('paste', this.boundPaste);

    // Удаляем глобальные обработчики
    if (this.boundHandleSelectionChange) {
      this.domContext.removeEventListener('selectionchange', this.boundHandleSelectionChange);
      this.boundHandleSelectionChange = undefined as any;
    }

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
