import type { HTMLEditor } from '../../app';
import { PopupManager } from '../../core/ui/PopupManager';
import type { Plugin } from '../../core/Plugin';
import { createToolbarButton } from '../ToolbarPlugin/utils.ts';
import { collaborationIcon } from '../../icons';
import { createContainer, createLink } from '../../utils/helpers.ts';

interface CollaborationPluginOptions {
  serverUrl?: string; // URL WebSocket сервера
  autoStart?: boolean; // Автоматически начинать совместную работу
}

function generateToken(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

export class CollaborationPlugin implements Plugin {
  name = 'collaboration';
  private editor: HTMLEditor | null = null;
  private ws: WebSocket | null = null;
  private docId: string | null = null;
  private popup: PopupManager | null = null;
  private options: CollaborationPluginOptions;
  private toolbarButton: HTMLElement | null = null;
  private isExternalUpdate: boolean = false; // Флаг для отслеживания внешних изменений
  private contentVersion: number = 0; // Текущая версия контента
  private lastContent: string = ''; // Последний известный контент
  private unsubscribeFromContentChange: (() => void) | null = null; // Функция для отписки от изменений
  private status: string = '';
  private userId: string = '';

  constructor(options: CollaborationPluginOptions = {}) {
    this.options = {
      serverUrl: 'ws://localhost:8080',
      autoStart: true,
      ...options,
    };
  }

  initialize(editor: HTMLEditor): void {
    const urlParams = new URLSearchParams(window.location.search);
    this.userId = urlParams.get('userId') ?? generateToken();

    this.editor = editor;
    this.popup = new PopupManager(this.editor, {
      title: 'Collaboration',
      closeOnClickOutside: false,
      buttons: [
        {
          label: 'Start Collaboration',
          variant: 'primary',
          onClick: () => this.startCollaboration(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'collaboration-content',
          content: () => this.createCollaborationContent(),
        },
      ],
    });

    if (this.options.autoStart) {
      this.setupCollaboration();
    }

    this.addToolbarButton();
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: collaborationIcon,
      title: this.editor?.t('Collaboration'),
      onClick: () => this.popup?.show(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private updateConnectionStatus(status: string): void {
    this.status = status;
    if (!this.editor) return;
    const statusElement = this.editor.getInnerContainer().querySelector('.collaboration-status');
    if (statusElement) {
      statusElement.textContent = this.editor.t('Collaboration') + ': ' + status;
    }
  }

  private setupCollaboration(): void {
    if (!this.editor) {
      return;
    }

    if (!this.options.serverUrl) {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    this.docId = urlParams.get('docId') ?? null;

    if (!this.docId) {
      return;
    }

    this.ws = new WebSocket(this.options.serverUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.updateConnectionStatus('Connected');
      this.ws?.send(
        JSON.stringify({
          type: 'join',
          docId: this.docId,
          userId: this.userId,
          content: this.editor?.getHtml(),
        })
      );
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init' || data.type === 'update') {
        console.log('onmessage', data);

        if (data.userId === this.userId) {
          console.log('Ignoring self update');
          return;
        }

        if (!data.content || data.content === '') {
          console.log('Ignoring empty version:', data.content);
          return;
        }

        // Проверяем версию контента
        if (data.version && data.version < this.contentVersion) {
          console.log('Ignoring older version:', data.version);
          return;
        }

        // Нормализуем полученный контент
        const normalizedContent = this.normalizeHtml(data.content);

        // Проверяем, изменился ли контент
        if (normalizedContent === this.normalizeHtml(this.lastContent)) {
          console.log('Content is the same, ignoring update');
          return;
        }

        this.isExternalUpdate = true;

        this.editor?.setHtml(data.content);
        this.lastContent = data.content; // Сохраняем новый контент
        this.contentVersion = data.version; // Обновляем текущую версию

        this.isExternalUpdate = false;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateConnectionStatus('Connection error');
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting...');
      this.updateConnectionStatus('Reconnecting...');
      setTimeout(() => this.setupCollaboration(), 3000); // Переподключение через 3 секунды
    };

    // Подписываемся на изменения контента
    this.unsubscribeFromContentChange = this.editor.subscribeToContentChange(
      (newContent?: string) => {
        this.handleContentChange(newContent);
      }
    );
  }

  private debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null;

    return (...args: any[]) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  private debouncedSendUpdate = this.debounce((newContent: string) => {
    if (this.ws && this.docId && this.status === 'Connected') {
      this.ws.send(
        JSON.stringify({
          type: 'update',
          docId: this.docId,
          userId: this.userId,
          content: newContent,
          version: this.contentVersion,
        })
      );
      console.log('Content sent:', newContent);
    }
  }, 300);

  private handleContentChange(newContent?: string): void {
    if (!newContent || this.isExternalUpdate) {
      return;
    }

    // Нормализуем текущий контент
    const normalizedCurrentContent = this.normalizeHtml(newContent);
    const normalizedLastContent = this.normalizeHtml(this.lastContent);

    // Проверяем, изменился ли контент
    if (normalizedCurrentContent !== normalizedLastContent) {
      console.log('Content changed, scheduling update');
      this.lastContent = newContent;
      this.contentVersion += 1;

      // Планируем отправку обновления с задержкой
      this.debouncedSendUpdate(newContent);
    }
  }

  /**
   * Нормализует HTML, удаляя лишние пробелы и переносы строк
   * @param html Исходный HTML
   * @returns Нормализованный HTML
   */
  private normalizeHtml(html: string): string {
    return html
      .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
      .replace(/>\s+</g, '><') // Удаляем пробелы между тегами
      .replace(/\s+</g, '<') // Удаляем пробелы перед открывающими тегами
      .replace(/>\s+/g, '>') // Удаляем пробелы после закрывающих тегов
      .trim(); // Удаляем пробелы в начале и конце
  }

  private createCollaborationContent(): HTMLElement {
    const container = createContainer('p-4');

    const docId = generateToken();
    const collaborationLink = `${window.location.origin}${window.location.pathname}?docId=${docId}`;

    const linkElement = createLink(collaborationLink, collaborationLink, '_blank');

    container.appendChild(document.createTextNode('Share this link to collaborate: '));
    container.appendChild(linkElement);

    return container;
  }

  private startCollaboration(): void {
    const docId = generateToken();
    window.location.href = `${window.location.origin}${window.location.pathname}?docId=${docId}}`;
  }

  destroy(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    if (this.unsubscribeFromContentChange) {
      this.unsubscribeFromContentChange();
      this.unsubscribeFromContentChange = null;
    }
    this.editor = null;
  }
}
