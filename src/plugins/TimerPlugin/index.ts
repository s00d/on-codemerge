import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { TimerMenu } from './components/TimerMenu';
import { TimerManager } from './services/TimerManager';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { timerIcon } from '../../icons';
import type { Timer } from './types';
import { TimerContextMenu } from './components/TimerContextMenu';
import { createLineBreak } from '../../utils/helpers';

export class TimerPlugin implements Plugin {
  name = 'timer';
  hotkeys = [{ keys: 'Ctrl+Alt+D', description: 'Insert timer', command: 'timer', icon: '⏱️' }];
  private editor: HTMLEditor | null = null;
  private menu: TimerMenu | null = null;
  private manager!: TimerManager;
  private toolbarButton: HTMLElement | null = null;
  private contextMenu: TimerContextMenu | null = null;

  constructor() {
    // TimerManager будет создан в initialize с передачей editor
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.manager = new TimerManager(editor);
    this.menu = new TimerMenu(this.manager, editor);
    this.contextMenu = new TimerContextMenu(this.manager, editor);

    this.addToolbarButton();
    this.setupEventListeners();
    this.startTimerUpdates();

    // Регистрируем команду
    editor.on('timer', () => this.showTimerMenu());
  }

  private addToolbarButton(): void {
    if (!this.editor) return;

    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: timerIcon,
        title: this.editor.t('Timer'),
        onClick: () => this.showTimerMenu(),
      });

      toolbar.appendChild(this.toolbarButton);
    }
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    // Обработка кликов по таймерам
    this.editor.getContainer().addEventListener('click', (e) => this.handleTimerClick(e));

    // Обработка контекстного меню
    this.editor.getContainer().addEventListener('contextmenu', (e) => this.handleContextMenu(e));
  }

  private handleTimerClick(e: MouseEvent): void {
    const target = e.target as Element;
    const timerElement = target.closest('.timer-widget');

    if (!timerElement) return;

    const timerId = timerElement.getAttribute('data-timer-id');
    if (!timerId) return;

    const timer = this.manager.getTimer(timerId);
    if (!timer) return;

    // Открываем форму редактирования
    this.menu?.showEditTimerForm(timer);
  }

  private handleContextMenu(e: MouseEvent): void {
    const target = e.target as Element;
    const timerElement = target.closest('.timer-widget');

    if (!timerElement) return;

    e.preventDefault();

    const timerId = timerElement.getAttribute('data-timer-id');
    if (!timerId) return;

    const timer = this.manager.getTimer(timerId);
    if (!timer) return;

    this.contextMenu?.show(e, timer, (action: string) => {
      this.handleContextMenuAction(action, timer);
    });
  }

  private handleContextMenuAction(action: string, target: Timer): void {
    switch (action) {
      case 'edit-timer':
        this.menu?.showEditTimerForm(target);
        break;
      case 'copy-timer':
        try {
          this.manager.copyTimer(target.id);
          this.editor?.showSuccessNotification(
            this.editor?.t('Timer copied successfully') || 'Timer copied successfully'
          );
          this.refreshTimers();
        } catch (error) {
          this.editor?.showErrorNotification(
            this.editor?.t('Failed to copy timer') || 'Failed to copy timer'
          );
        }
        break;
      case 'export-timer':
        this.showExportDialog(target);
        break;
      case 'import-timer':
        this.showImportDialog();
        break;
      case 'delete-timer':
        this.manager.deleteTimer(target.id);
        this.refreshTimers();
        break;
    }
  }

  private showTimerMenu(): void {
    if (!this.editor) return;

    // Сохраняем позицию курсора перед открытием меню
    const savedPosition = this.editor.saveCursorPosition();

    // Показываем меню таймеров
    this.menu?.show((timerData: Timer) => {
      if (this.editor) {
        // Восстанавливаем позицию курсора перед вставкой
        if (savedPosition) {
          this.editor.restoreCursorPosition(savedPosition);
        }
        this.insertTimer(timerData);
      }
    });
  }

  private insertTimer(timerData: Timer): void {
    if (!this.editor) return;

    const timerHtml = this.manager.generateTimerHTML(timerData);

    // Используем встроенный метод insertContent для вставки таймера
    this.editor.insertContent(timerHtml);
    this.editor.insertContent(createLineBreak());
  }

  private refreshTimers(): void {
    const timerElements = this.editor?.getContainer().querySelectorAll('.timer-widget');

    timerElements?.forEach((element) => {
      const timerId = element.getAttribute('data-timer-id');
      if (!timerId) return;

      const timerData = this.manager.getTimer(timerId);
      if (!timerData) return;

      // Обновляем весь таймер используя метод из менеджера
      const updatedHtml = this.manager.generateTimerHTML(timerData);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = updatedHtml;

      // Получаем новый элемент таймера и скрипт
      const newTimerElement = tempDiv.firstElementChild;
      const newScript = tempDiv.querySelector('script');

      if (newTimerElement && element.parentNode) {
        // Удаляем старый скрипт, если он есть
        const oldScript = element.parentNode.querySelector(`script[data-timer-id="${timerId}"]`);
        if (oldScript) {
          oldScript.remove();
        }

        // Заменяем элемент таймера
        if (element.parentNode) {
          element.parentNode.replaceChild(newTimerElement, element);
        }

        // Добавляем новый скрипт, если он есть
        if (newScript && element.parentNode) {
          newScript.setAttribute('data-timer-id', timerId);
          element.parentNode.appendChild(newScript);
        }
      }
    });
  }

  private startTimerUpdates(): void {
    // Обновляем таймеры каждую секунду
    setInterval(() => {
      this.refreshTimers();
    }, 1000);
  }

  private showExportDialog(timer: Timer): void {
    try {
      const data = JSON.stringify(timer, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timer-${timer.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      this.editor?.showErrorNotification(this.editor.t('Export failed') || 'Export failed');
    }
  }

  private showImportDialog(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const timer = JSON.parse(e.target?.result as string);
            this.manager.importTimer(timer);
            this.editor?.showSuccessNotification(
              this.editor?.t('Timer imported successfully') || 'Timer imported successfully'
            );
            this.refreshTimers();
          } catch (error) {
            this.editor?.showErrorNotification(this.editor?.t('Import failed') || 'Import failed');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  public destroy(): void {
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }

    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    this.editor?.off('timer');
    this.editor = null;
    this.manager = null!;
    this.toolbarButton = null;
  }
}
