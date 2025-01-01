import type { HTMLEditor } from '../../app';
import { PopupManager } from '../../core/ui/PopupManager';
import type { Plugin } from '../../core/Plugin';
import { createToolbarButton } from '../ToolbarPlugin/utils.ts';
import { collaborationIcon } from '../../icons';

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

  constructor(options: CollaborationPluginOptions = {}) {
    this.options = {
      serverUrl: 'ws://localhost:8080',
      autoStart: true,
      ...options,
    };
  }

  initialize(editor: HTMLEditor): void {
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
    this.docId = urlParams.get('docId') || generateToken();

    this.ws = new WebSocket(this.options.serverUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.updateConnectionStatus('Connected');
      this.ws?.send(JSON.stringify({ type: 'join', docId: this.docId }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init' || data.type === 'update') {
        console.log('onmessage', data.content);

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

  private handleContentChange(newContent?: string): void {
    if (!newContent || this.isExternalUpdate) {
      return;
    }

    // Нормализуем текущий контент
    const normalizedCurrentContent = this.normalizeHtml(newContent);
    const normalizedLastContent = this.normalizeHtml(this.lastContent);

    // Проверяем, изменился ли контент
    if (normalizedCurrentContent !== normalizedLastContent) {
      console.log('Content changed, sending update');
      this.lastContent = newContent;
      this.contentVersion += 1;

      if (this.ws && this.docId) {
        this.ws.send(
          JSON.stringify({
            type: 'update',
            docId: this.docId,
            content: newContent,
            version: this.contentVersion,
          })
        );
      }
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
    const container = document.createElement('div');
    container.className = 'p-4';

    const docId = generateToken();
    const collaborationLink = `${window.location.origin}${window.location.pathname}?docId=${docId}`;

    const linkElement = document.createElement('a');
    linkElement.href = collaborationLink;
    linkElement.textContent = collaborationLink;
    linkElement.target = '_blank';

    container.appendChild(document.createTextNode('Share this link to collaborate: '));
    container.appendChild(linkElement);

    return container;
  }

  private startCollaboration(): void {
    const docId = generateToken();
    window.location.href = `${window.location.origin}${window.location.pathname}?docId=${docId}`;
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
