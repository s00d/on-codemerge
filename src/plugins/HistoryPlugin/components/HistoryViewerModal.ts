import { PopupManager } from '../../../core/ui/PopupManager';
import type { HistoryState } from '../types';
import { formatTimestamp } from '../utils/formatters';
import { computeDiff, type DiffChange } from '../utils/diff';
import { closeIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class HistoryViewerModal {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private states: HistoryState[] = [];
  private currentIndex: number = -1;
  private selectedIndex: number = -1;
  private onRestore: ((content: string) => void) | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      className: 'history-viewer-modal',
      closeOnClickOutside: true,
      items: [
        {
          type: 'custom',
          id: 'html-viewer-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    // Основной контейнер
    const container = document.createElement('div');
    container.className = 'p-4';

    // Заголовок и кнопка закрытия
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold';
    title.textContent = this.editor.t('Edit History');

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = closeIcon;

    header.appendChild(title);
    header.appendChild(closeButton);

    // Сетка для списка истории и просмотра изменений
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-4';

    // Контейнер для списка истории
    const historyList = document.createElement('div');
    historyList.className = 'history-list max-h-[60vh] overflow-y-auto';

    // Контейнер для просмотра изменений
    const diffView = document.createElement('div');
    diffView.className = 'diff-view max-h-[60vh] overflow-y-auto p-3 bg-gray-50 rounded-lg';

    // Сборка структуры
    grid.appendChild(historyList);
    grid.appendChild(diffView);
    container.appendChild(header);
    container.appendChild(grid);

    // Настройка обработчиков событий
    this.setupEventListeners(container);

    return container;
  }

  private setupEventListeners(container: HTMLElement): void {
    const closeButton = container.querySelector('.close-button');
    closeButton?.addEventListener('click', () => {
      this.popup.hide();
    });

    container.addEventListener('click', (e) => {
      const button = (e.target as Element).closest('[data-index]');
      if (!button) return;

      const index = parseInt(button.getAttribute('data-index') || '0', 10);

      if ((e.target as Element).closest('.restore-button')) {
        const state = this.states[index];
        if (state && this.onRestore) {
          this.onRestore(state.content);
          this.popup.hide();
        }
      } else {
        this.selectedIndex = index;
        this.showDiff(index);
      }
    });
  }

  private renderHistoryList(): void {
    const listContainer = this.popup.getElement().querySelector('.history-list');
    if (!listContainer) return;

    // Очистка контейнера
    listContainer.innerHTML = '';

    // Создание элементов списка
    this.states.forEach((state, index) => {
      const item = this.createHistoryItem(state, index);
      listContainer.appendChild(item);
    });
  }

  private createHistoryItem(state: HistoryState, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = `history-item ${index === this.currentIndex ? 'current' : ''} ${index === this.selectedIndex ? 'selected' : ''}`;
    item.dataset.index = index.toString();

    const itemContent = document.createElement('div');
    itemContent.className =
      'flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer';

    const itemText = document.createElement('div');
    const version = document.createElement('div');
    version.className = 'text-sm font-medium';
    version.textContent = `Version ${index + 1}`;

    const timestamp = document.createElement('div');
    timestamp.className = 'text-xs text-gray-500';
    timestamp.textContent = formatTimestamp(state.timestamp);

    itemText.appendChild(version);
    itemText.appendChild(timestamp);

    const restoreButton = document.createElement('button');
    restoreButton.className =
      'restore-button px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded';
    restoreButton.textContent = this.editor.t('Restore');

    itemContent.appendChild(itemText);
    itemContent.appendChild(restoreButton);
    item.appendChild(itemContent);

    return item;
  }

  private showDiff(index: number): void {
    const diffContainer = this.popup.getElement().querySelector('.diff-view');
    if (!diffContainer) return;

    const currentState = this.states[index];
    const previousState = index > 0 ? this.states[index - 1] : { content: '' };

    const changes = computeDiff(previousState.content, currentState.content);
    const diffHtml = this.renderDiff(changes);

    // Очистка контейнера
    diffContainer.innerHTML = '';

    // Создание элементов для отображения изменений
    const diffTitle = document.createElement('div');
    diffTitle.className = 'text-sm mb-2 text-gray-500';
    diffTitle.textContent =
      index > 0
        ? this.editor.t('Changes from previous version:')
        : this.editor.t('Initial version');

    const diffContent = document.createElement('div');
    diffContent.className = 'diff-content';
    diffContent.innerHTML = diffHtml;

    diffContainer.appendChild(diffTitle);
    diffContainer.appendChild(diffContent);
  }

  private renderDiff(changes: DiffChange[]): string {
    return changes
      .map((change) => {
        switch (change.type) {
          case 'add':
            return `<span class="diff-add">${change.value}</span>`;
          case 'remove':
            return `<span class="diff-remove">${change.value}</span>`;
          default:
            return change.value;
        }
      })
      .join('');
  }

  public show(
    states: HistoryState[],
    currentIndex: number,
    onRestore: (content: string) => void
  ): void {
    this.states = states;
    this.currentIndex = currentIndex;
    this.selectedIndex = currentIndex;
    this.onRestore = onRestore;
    this.renderHistoryList();
    this.showDiff(currentIndex);
    this.popup.show();
  }

  public destroy(): void {
    // Уничтожение PopupManager
    if (this.popup.destroy) {
      this.popup.destroy();
    }

    // Очистка обработчиков событий
    const popupElement = this.popup.getElement();
    if (popupElement) {
      const closeButton = popupElement.querySelector('.close-button');
      closeButton?.removeEventListener('click', () => {
        this.popup.hide();
      });

      popupElement.removeEventListener('click', (e) => {
        const button = (e.target as Element).closest('[data-index]');
        if (!button) return;

        const index = parseInt(button.getAttribute('data-index') || '0', 10);

        if ((e.target as Element).closest('.restore-button')) {
          const state = this.states[index];
          if (state && this.onRestore) {
            this.onRestore(state.content);
            this.popup.hide();
          }
        } else {
          this.selectedIndex = index;
          this.showDiff(index);
        }
      });
    }

    // Очистка состояния
    this.states = [];
    this.currentIndex = -1;
    this.selectedIndex = -1;
    this.onRestore = null;

    // Очистка ссылок
    this.editor = null!;
    this.popup = null!;
  }
}
