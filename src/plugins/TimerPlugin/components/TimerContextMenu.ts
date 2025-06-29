import { ContextMenu } from '../../../core/ui/ContextMenu';
import type { TimerManager } from '../services/TimerManager';
import type { Timer } from '../types';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class TimerContextMenu {
  private editor: HTMLEditor;
  private currentContextMenu: ContextMenu | null = null;

  constructor(_manager: TimerManager, editor: HTMLEditor) {
    this.editor = editor;
  }

  public show(event: MouseEvent, _timer: Timer, onAction: (action: string) => void): void {
    // Закрываем предыдущее контекстное меню, если оно открыто
    if (this.currentContextMenu) {
      this.currentContextMenu.destroy();
      this.currentContextMenu = null;
    }

    const menuItems = [
      {
        label: this.editor.t('Edit Timer'),
        icon: '✏️',
        action: 'edit-timer',
        onClick: () => {
          onAction('edit-timer');
          this.closeContextMenu();
        },
        type: 'button' as const,
      },
      {
        label: this.editor.t('Copy Timer'),
        icon: '📋',
        action: 'copy-timer',
        onClick: () => {
          onAction('copy-timer');
          this.closeContextMenu();
        },
        type: 'button' as const,
      },
      {
        label: this.editor.t('Export Timer'),
        icon: '📤',
        action: 'export-timer',
        onClick: () => {
          onAction('export-timer');
          this.closeContextMenu();
        },
        type: 'button' as const,
      },
      {
        label: this.editor.t('Import Timer'),
        icon: '📥',
        action: 'import-timer',
        onClick: () => {
          onAction('import-timer');
          this.closeContextMenu();
        },
        type: 'button' as const,
      },
      {
        type: 'divider' as const,
      },
      {
        label: this.editor.t('Delete Timer'),
        icon: '🗑️',
        action: 'delete-timer',
        className: 'danger',
        onClick: () => {
          onAction('delete-timer');
          this.closeContextMenu();
        },
        type: 'button' as const,
      },
    ];

    // Создаем новый экземпляр контекстного меню с кнопками
    this.currentContextMenu = new ContextMenu(this.editor, menuItems);

    // Создаем временный элемент для позиционирования
    const tempElement = document.createElement('div');
    tempElement.style.position = 'fixed';
    tempElement.style.left = `${event.clientX}px`;
    tempElement.style.top = `${event.clientY}px`;
    document.body.appendChild(tempElement);

    this.currentContextMenu.show(tempElement, event.clientX, event.clientY);

    // Удаляем временный элемент
    document.body.removeChild(tempElement);
  }

  private closeContextMenu(): void {
    if (this.currentContextMenu) {
      this.currentContextMenu.destroy();
      this.currentContextMenu = null;
    }
  }

  public destroy(): void {
    this.closeContextMenu();
    this.editor = null!;
  }
}
