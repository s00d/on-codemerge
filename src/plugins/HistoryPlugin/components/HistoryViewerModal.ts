import { PopupManager } from '../../../core/ui/PopupManager';
import type { HistoryState } from '../types';
import { formatTimestamp } from '../utils/formatters';
import { computeDiff, type DiffChange } from '../utils/diff';
import { closeIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createButton, createContainer, createH } from '../../../utils/helpers.ts';

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
    const container = createContainer('p-4');
    const header = createContainer('flex items-center justify-between mb-4');
    const title = createH('h3', 'text-lg font-semibold', this.editor.t('Edit History'));
    const closeButton = createButton('', () => {
      this.popup.hide();
    });
    closeButton.className = 'close-button';
    closeButton.innerHTML = closeIcon;

    header.appendChild(title);
    header.appendChild(closeButton);

    // Сетка для списка истории и просмотра изменений
    const grid = createContainer('grid grid-cols-2 gap-4');
    const historyList = createContainer('history-list max-h-[60vh] overflow-y-auto');
    const diffView = createContainer(
      'diff-view max-h-[60vh] overflow-y-auto p-3 bg-gray-50 rounded-lg'
    );

    // Сборка структуры
    grid.appendChild(historyList);
    grid.appendChild(diffView);
    container.appendChild(header);
    container.appendChild(grid);

    // Настройка обработчиков событий
    container.addEventListener('click', (e) => {
      const button = (e.target as Element).closest('[data-index]');
      if (!button) return;

      const index = parseInt(button.getAttribute('data-index') || '0', 10);

      this.selectedIndex = index;
      this.showDiff(index);
    });

    return container;
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
    const item = createContainer(
      `history-item ${index === this.currentIndex ? 'current' : ''} ${index === this.selectedIndex ? 'selected' : ''}`
    );
    item.dataset.index = index.toString();

    const itemContent = createContainer(
      'flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer'
    );
    const itemText = createContainer();
    const version = createContainer('text-sm font-medium');
    version.textContent = `Version ${index + 1}`;

    const timestamp = createContainer('ext-xs text-gray-500', formatTimestamp(state.timestamp));

    itemText.appendChild(version);
    itemText.appendChild(timestamp);

    const restoreButton = createButton(this.editor.t('Restore'), (e) => {
      e.preventDefault();
      const state = this.states[index];
      if (state && this.onRestore) {
        this.onRestore(state.content);
        this.popup.hide();
      }
    });

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
    const diffTitle = createContainer('text-sm mb-2 text-gray-500');
    diffTitle.textContent =
      index > 0
        ? this.editor.t('Changes from previous version:')
        : this.editor.t('Initial version');

    const diffContent = createContainer('diff-content');
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
