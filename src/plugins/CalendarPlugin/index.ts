import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { CalendarMenu } from './components/CalendarMenu';
import { CalendarManager } from './services/CalendarManager';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { calendarIcon } from '../../icons';
import type { Calendar, CalendarEvent } from './types';
import { CalendarContextMenu } from './components/CalendarContextMenu';
import { createLineBreak } from '../../utils/helpers';

export class CalendarPlugin implements Plugin {
  name = 'calendar';
  hotkeys = [
    { keys: 'Ctrl+Alt+L', description: 'Insert calendar', command: 'calendar', icon: '📅' },
  ];
  private editor: HTMLEditor | null = null;
  private menu: CalendarMenu | null = null;
  private manager: CalendarManager;
  private toolbarButton: HTMLElement | null = null;
  private contextMenu: CalendarContextMenu | null = null;

  constructor() {
    this.manager = new CalendarManager();
  }

  initialize(editor: HTMLEditor): void {
    this.menu = new CalendarMenu(this.manager, editor, () => this.showImportDialog());
    this.editor = editor;
    this.contextMenu = new CalendarContextMenu(editor, this.handleContextMenuAction.bind(this));
    this.addToolbarButton();
    this.setupEventListeners();
    this.editor.on('calendar', () => {
      this.showCalendarMenu();
    });
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: calendarIcon,
        title: this.editor?.t('Calendar'),
        onClick: () => this.showCalendarMenu(),
      });
      toolbar.appendChild(this.toolbarButton);
    }
  }

  private setupEventListeners(): void {
    if (!this.editor) return;
    const container = this.editor.getContainer();
    container.addEventListener('click', this.handleCalendarClick.bind(this));
    container.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  private handleCalendarClick(e: MouseEvent): void {
    const eventElement = (e.target as Element).closest('.calendar-event');
    if (!eventElement) return;

    e.preventDefault();
    const eventId = eventElement.getAttribute('data-event-id');
    if (!eventId) return;

    const event = this.manager.getEvent(eventId);
    if (event) {
      this.menu?.showEditEvent(event, () => this.refreshCalendar());
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    const calendarElement = (e.target as Element).closest('.calendar-widget');
    const eventElement = (e.target as Element).closest('.calendar-event');

    if (calendarElement instanceof HTMLElement) {
      e.preventDefault();
      const calendarId = calendarElement.getAttribute('data-calendar-id');
      const calendar = calendarId ? this.manager.getCalendar(calendarId) : null;
      if (calendar) {
        this.contextMenu?.show(calendar, e.clientX, e.clientY);
      }
    } else if (eventElement instanceof HTMLElement) {
      e.preventDefault();
      const eventId = eventElement.getAttribute('data-event-id');
      const event = eventId ? this.manager.getEvent(eventId) : null;
      if (event) {
        this.contextMenu?.show(event, e.clientX, e.clientY);
      }
    }
  }

  private handleContextMenuAction(action: string, target: Calendar | CalendarEvent) {
    const refreshCallback = () => this.refreshCalendar();

    if ('events' in target) {
      // Calendar actions
      switch (action) {
        case 'add-event':
          this.menu?.showCreateEvent(target.id, refreshCallback);
          break;
        case 'edit-calendar':
          this.menu?.showEditCalendarForm(target);
          break;
        case 'copy-calendar':
          try {
            this.manager.copyCalendar(target.id);
            this.editor?.showSuccessNotification(
              this.editor?.t('Calendar copied successfully') || 'Calendar copied successfully'
            );
            this.refreshCalendar();
          } catch (error) {
            this.editor?.showErrorNotification(
              this.editor?.t('Failed to copy calendar') || 'Failed to copy calendar'
            );
          }
          break;
        case 'export-calendar':
          this.showExportDialog(target);
          break;
        case 'import-calendar':
          this.showImportDialog();
          break;
        case 'delete-calendar':
          this.manager.deleteCalendar(target.id);
          this.refreshCalendar();
          break;
      }
    } else {
      // Event actions
      switch (action) {
        case 'edit-event':
          this.menu?.showEditEvent(target, refreshCallback);
          break;
        case 'copy-event':
          try {
            this.manager.copyEvent(target.id);
            this.editor?.showSuccessNotification(
              this.editor?.t('Event copied successfully') || 'Event copied successfully'
            );
            this.refreshCalendar();
          } catch (error) {
            this.editor?.showErrorNotification(
              this.editor?.t('Failed to copy event') || 'Failed to copy event'
            );
          }
          break;
        case 'delete-event':
          this.manager.deleteEvent(target.id);
          this.refreshCalendar();
          break;
      }
    }
  }

  private showCalendarMenu(): void {
    if (!this.editor) return;

    // Сохраняем позицию курсора перед открытием меню
    const savedPosition = this.editor.saveCursorPosition();

    // Сначала показываем список календарей
    this.menu?.show((calendarData: Calendar) => {
      if (this.editor) {
        // Восстанавливаем позицию курсора перед вставкой
        if (savedPosition) {
          this.editor.restoreCursorPosition(savedPosition);
        }
        this.insertCalendar(calendarData);
      }
    });
  }

  private insertCalendar(calendarData: Calendar): void {
    if (!this.editor) return;

    const calendarHtml = this.manager.generateCalendarHTML(calendarData);

    // Используем встроенный метод insertContent для вставки календаря
    this.editor.insertContent(calendarHtml);
    this.editor.insertContent(createLineBreak());
  }

  private refreshCalendar(): void {
    const calendarElements = this.editor?.getContainer().querySelectorAll('.calendar-widget');

    calendarElements?.forEach((element) => {
      const calendarId = element.getAttribute('data-calendar-id');
      if (!calendarId) return;

      const calendarData = this.manager.getCalendar(calendarId);
      if (!calendarData) return;

      // Обновляем весь календарь используя метод из менеджера
      const updatedHtml = this.manager.generateCalendarHTML(calendarData);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = updatedHtml;
      const newCalendarElement = tempDiv.firstElementChild;

      if (newCalendarElement && element.parentNode) {
        element.parentNode.replaceChild(newCalendarElement, element);
      }
    });
  }

  private showExportDialog(calendar: Calendar): void {
    try {
      const data = JSON.stringify(calendar, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-${calendar.id}.json`;
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
            const calendar = JSON.parse(e.target?.result as string);
            this.manager.importCalendar(calendar);
            this.editor?.showSuccessNotification(
              this.editor?.t('Calendar imported successfully') || 'Calendar imported successfully'
            );
            this.refreshCalendar();
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

    this.editor?.off('calendar');
    this.editor = null;
    this.manager = null!;
    this.toolbarButton = null;
  }
}
