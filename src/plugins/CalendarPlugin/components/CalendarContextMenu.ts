import type { Calendar, CalendarEvent } from '../types';
import type { EditorAPI, MenuItem } from '@on-codemerge/sdk';
import { copyIcon, deleteIcon, editIcon, exportIcon, insertIcon, uploadIcon } from '../../../icons';

export class CalendarContextMenu {
  private readonly editor: EditorAPI;
  private readonly onAction: (action: string, target: Calendar | CalendarEvent) => void;

  constructor(
    editor: EditorAPI,
    onAction: (action: string, target: Calendar | CalendarEvent) => void
  ) {
    this.editor = editor;
    this.onAction = onAction;
  }

  public show(target: Calendar | CalendarEvent, x: number, y: number): void {
    this.editor.ui.menu.open(this.getMenuItems(target), x, y);
  }

  public hide(): void {
    /* ContextMenuService closes on outside click */
  }

  private getMenuItems(target: Calendar | CalendarEvent): MenuItem[] {
    const t = (k: string) => this.editor.t(k) || k;
    const act = (action: string) => () => {
      this.onAction(action, target);
    };

    if ('events' in target) {
      return [
        { type: 'group', groupTitle: t('calendar.title') },
        {
          label: t('calendar.addEvent'),
          icon: insertIcon,
          onClick: act('add-event'),
        },
        { label: t('calendar.editCalendar'), icon: editIcon, onClick: act('edit-calendar') },
        { type: 'divider' },
        { type: 'group', groupTitle: t('common.actions') },
        { label: t('calendar.copyCalendar'), icon: copyIcon, onClick: act('copy-calendar') },
        { label: t('calendar.exportCalendar'), icon: exportIcon, onClick: act('export-calendar') },
        {
          label: t('calendar.importCalendar'),
          icon: uploadIcon,
          onClick: act('import-calendar'),
        },
        { type: 'divider' },
        {
          label: t('calendar.deleteCalendar'),
          icon: deleteIcon,
          variant: 'danger',
          onClick: act('delete-calendar'),
        },
      ];
    }

    return [
      { type: 'group', groupTitle: t('calendar.event') },
      { label: t('calendar.editEvent'), icon: editIcon, onClick: act('edit-event') },
      { label: t('calendar.copyEvent'), icon: copyIcon, onClick: act('copy-event') },
      { type: 'divider' },
      {
        label: t('calendar.deleteEvent'),
        icon: deleteIcon,
        variant: 'danger',
        onClick: act('delete-event'),
      },
    ];
  }

  public destroy(): void {
    this.editor.ui.menu.hide();
  }
}
