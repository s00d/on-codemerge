import type { Calendar, CalendarEvent } from '../types';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { ContextMenu } from '../../../core/ui/ContextMenu';
import { editIcon, deleteIcon, copyIcon, exportIcon } from '../../../icons';

export class CalendarContextMenu {
  private editor: HTMLEditor;
  private onAction: (action: string, target: Calendar | CalendarEvent) => void;
  private currentContextMenu: ContextMenu | null = null;

  constructor(editor: HTMLEditor, onAction: (action: string, target: Calendar | CalendarEvent) => void) {
    this.editor = editor;
    this.onAction = onAction;
  }

  public show(target: Calendar | CalendarEvent, x: number, y: number): void {
    // Уничтожаем предыдущее меню, если оно есть
    if (this.currentContextMenu) {
      this.currentContextMenu.destroy();
    }

    const menuItems = this.getMenuItems(target);
    this.currentContextMenu = new ContextMenu(this.editor, menuItems);

    // Находим элемент календаря или события в DOM
    let element: HTMLElement;
    if ('events' in target) {
      // Calendar
      element = this.editor.getContainer().querySelector(`[data-calendar-id="${target.id}"]`) as HTMLElement;
    } else {
      // Event
      element = this.editor.getContainer().querySelector(`[data-event-id="${target.id}"]`) as HTMLElement;
    }

    if (element) {
      this.currentContextMenu.show(element, x, y);
    }
  }

  public hide(): void {
    if (this.currentContextMenu) {
      this.currentContextMenu.hide();
    }
  }

  private getMenuItems(target: Calendar | CalendarEvent) {
    if ('events' in target) {
      // Calendar menu
      return [
        {
          type: 'group' as const,
          groupTitle: this.editor.t('Calendar'),
          subMenu: [
            {
              type: 'button' as const,
              title: this.editor.t('Add Event'),
              icon: '➕',
              action: 'add-event',
              onClick: () => this.executeAction('add-event', target),
              hotkey: 'Ctrl+Shift+E',
            },
            {
              type: 'button' as const,
              title: this.editor.t('Edit Calendar'),
              icon: editIcon,
              action: 'edit-calendar',
              onClick: () => this.executeAction('edit-calendar', target),
              hotkey: 'Ctrl+E',
            },
          ],
        },
        {
          type: 'divider' as const,
        },
        {
          type: 'group' as const,
          groupTitle: this.editor.t('Actions'),
          subMenu: [
            {
              type: 'button' as const,
              title: this.editor.t('Copy Calendar'),
              icon: copyIcon,
              action: 'copy-calendar',
              onClick: () => this.executeAction('copy-calendar', target),
              hotkey: 'Ctrl+C',
            },
            {
              type: 'button' as const,
              title: this.editor.t('Export Calendar'),
              icon: exportIcon,
              action: 'export-calendar',
              onClick: () => this.executeAction('export-calendar', target),
              hotkey: 'Ctrl+Shift+X',
            },
            {
              type: 'button' as const,
              title: this.editor.t('Import Calendar'),
              icon: '📥',
              action: 'import-calendar',
              onClick: () => this.executeAction('import-calendar', target),
              hotkey: 'Ctrl+Shift+I',
            },
          ],
        },
        {
          type: 'divider' as const,
        },
        {
          type: 'group' as const,
          groupTitle: this.editor.t('Delete'),
          subMenu: [
            {
              type: 'button' as const,
              title: this.editor.t('Delete Calendar'),
              icon: deleteIcon,
              action: 'delete-calendar',
              onClick: () => this.executeAction('delete-calendar', target),
              variant: 'danger' as const,
              hotkey: 'Delete',
            },
          ],
        },
      ];
    } else {
      // Event menu
      return [
        {
          type: 'group' as const,
          groupTitle: this.editor.t('Event'),
          subMenu: [
            {
              type: 'button' as const,
              title: this.editor.t('Edit Event'),
              icon: editIcon,
              action: 'edit-event',
              onClick: () => this.executeAction('edit-event', target),
              hotkey: 'Ctrl+E',
            },
            {
              type: 'button' as const,
              title: this.editor.t('Copy Event'),
              icon: copyIcon,
              action: 'copy-event',
              onClick: () => this.executeAction('copy-event', target),
              hotkey: 'Ctrl+C',
            },
          ],
        },
        {
          type: 'divider' as const,
        },
        {
          type: 'group' as const,
          groupTitle: this.editor.t('Delete'),
          subMenu: [
            {
              type: 'button' as const,
              title: this.editor.t('Delete Event'),
              icon: deleteIcon,
              action: 'delete-event',
              onClick: () => this.executeAction('delete-event', target),
              variant: 'danger' as const,
              hotkey: 'Delete',
            },
          ],
        },
      ];
    }
  }

  private executeAction(action: string, target: Calendar | CalendarEvent): void {
    this.onAction(action, target);
    this.hide();
  }

  public destroy(): void {
    this.currentContextMenu?.destroy();
  }
}
