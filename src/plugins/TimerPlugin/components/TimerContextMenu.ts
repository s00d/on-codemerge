import type { TimerManager } from '../services/TimerManager';
import type { Timer } from '../types';
import type { EditorAPI, MenuItem } from '@on-codemerge/sdk';
import { copyIcon, deleteIcon, editIcon, exportIcon, uploadIcon } from '../../../icons';

export class TimerContextMenu {
  private readonly editor: EditorAPI;

  constructor(_manager: TimerManager, editor: EditorAPI) {
    this.editor = editor;
  }

  public show(event: MouseEvent, _timer: Timer, onAction: (action: string) => void): void {
    const t = (k: string) => this.editor.t(k) || k;
    const items: MenuItem[] = [
      {
        label: t('timer.editTimer'),
        icon: editIcon,
        onClick: () => {
          onAction('edit-timer');
        },
      },
      {
        label: t('timer.copyTimer'),
        icon: copyIcon,
        onClick: () => {
          onAction('copy-timer');
        },
      },
      {
        label: t('timer.exportTimer'),
        icon: exportIcon,
        onClick: () => {
          onAction('export-timer');
        },
      },
      {
        label: t('timer.importTimer'),
        icon: uploadIcon,
        onClick: () => {
          onAction('import-timer');
        },
      },
      { type: 'divider' },
      {
        label: t('timer.deleteTimer'),
        icon: deleteIcon,
        variant: 'danger',
        onClick: () => {
          onAction('delete-timer');
        },
      },
    ];
    this.editor.ui.menu.open(items, event.clientX, event.clientY);
  }

  public destroy(): void {
    this.editor.ui.menu.hide();
  }
}
