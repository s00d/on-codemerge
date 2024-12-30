import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { ContextMenu } from '../../../core/ui/ContextMenu.ts';
import { AddRowCommand } from '../commands/AddRowCommand.ts';
import { AddColumnCommand } from '../commands/AddColumnCommand.ts';
import { DeleteRowCommand } from '../commands/DeleteRowCommand.ts';
import { DeleteColumnCommand } from '../commands/DeleteColumnCommand.ts';
import { DeleteTableCommand } from '../commands/DeleteTableCommand.ts';
import { StyleTableCellCommand } from '../commands/StyleTableCellCommand.ts';
import { CopyTableCommand } from '../commands/CopyTableCommand.ts';
import { MergeCellsCommand } from '../commands/MergeCellsCommand.ts';
import { SplitCellCommand } from '../commands/SplitCellCommand.ts';
import { AddHeaderRowCommand } from '../commands/AddHeaderRowCommand.ts';
import { RemoveHeaderRowCommand } from '../commands/RemoveHeaderRowCommand.ts';
import { SetCellBorderCommand } from '../commands/SetCellBorderCommand.ts';
import { deleteTableIcon, deleteRowIcon, deleteColumnIcon, copyIcon } from '../../../icons';
import { PopupManager } from '../../../core/ui/PopupManager.ts';

export const navigationIcons = {
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  remove: '×',
};

export const mergeIcon = '🟰'; // Иконка для объединения ячеек
export const splitIcon = '✂️'; // Иконка для разделения ячеек

export class TableContextMenu {
  private contextMenu: ContextMenu;
  private activeCell: HTMLTableCellElement | null = null;
  private popupManager: PopupManager;
  private colorPicker: HTMLInputElement | null = null;

  constructor(editor: HTMLEditor) {
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          title: editor.t('Add Row Above'),
          icon: navigationIcons.arrowUp,
          action: 'add-row-above',
          onClick: () => this.executeAction('add-row-above'),
        },
        {
          title: editor.t('Add Row Below'),
          icon: navigationIcons.arrowDown,
          action: 'add-row-below',
          onClick: () => this.executeAction('add-row-below'),
        },
        {
          title: editor.t('Add Column Left'),
          icon: navigationIcons.arrowLeft,
          action: 'add-col-left',
          onClick: () => this.executeAction('add-col-left'),
        },
        {
          title: editor.t('Add Column Right'),
          icon: navigationIcons.arrowRight,
          action: 'add-col-right',
          onClick: () => this.executeAction('add-col-right'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Delete Row'),
          icon: deleteRowIcon,
          action: 'delete-row',
          onClick: () => this.executeAction('delete-row'),
        },
        {
          title: editor.t('Delete Column'),
          icon: deleteColumnIcon,
          action: 'delete-col',
          onClick: () => this.executeAction('delete-col'),
        },
        {
          title: editor.t('Delete Table'),
          icon: deleteTableIcon,
          action: 'delete-table',
          onClick: () => this.executeAction('delete-table'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Copy'),
          icon: copyIcon,
          action: 'copy-table',
          onClick: () => this.executeAction('copy-table'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Merge Cells'),
          icon: mergeIcon,
          action: 'merge-cells',
          onClick: () => this.executeAction('merge-cells'),
        },
        {
          title: editor.t('Split Cell'),
          icon: splitIcon,
          action: 'split-cell',
          onClick: () => this.executeAction('split-cell'),
        },
        {
          type: 'divider',
        },
        {
          type: 'custom',
          customHTML: `<input type="color" class="table-color-picker" title="${editor.t('Background Color')}">`,
        },
      ],
      { orientation: 'vertical' }
    );

    this.popupManager = new PopupManager(editor, {
      title: editor.t('Set Cell Border'),
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Confirm'),
          variant: 'primary',
          onClick: () => this.handleBorderConfirm(),
        },
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popupManager.hide(),
        },
      ],
    });

    this.setupColorPicker();
  }

  private handleBorderConfirm(): void {
    const borderStyle = this.popupManager.getValue('border-style') as string;
    if (borderStyle && this.activeCell) {
      const command = new SetCellBorderCommand(this.activeCell, borderStyle);
      command.execute();
    }
    this.popupManager.hide();
  }

  private setupColorPicker(): void {
    this.colorPicker = this.contextMenu
      .getElement()
      .querySelector('.table-color-picker') as HTMLInputElement;
    if (this.colorPicker) {
      this.colorPicker.addEventListener('input', (e) => {
        if (this.activeCell) {
          const command = new StyleTableCellCommand(this.activeCell, {
            backgroundColor: (e.target as HTMLInputElement).value,
          });
          command.execute();
        }
      });

      this.colorPicker.addEventListener('contextmenu', (e) => e.stopPropagation());
    }
  }

  private executeAction(action: string): void {
    if (!this.activeCell) return;

    const table = this.activeCell.closest('table');
    if (!table || !(table instanceof HTMLTableElement)) return;

    let command: Command | null = null;

    switch (action) {
      case 'add-row-above':
        command = new AddRowCommand(table, this.activeCell, true);
        break;
      case 'add-row-below':
        command = new AddRowCommand(table, this.activeCell, false);
        break;
      case 'add-col-left':
        command = new AddColumnCommand(table, this.activeCell, true);
        break;
      case 'add-col-right':
        command = new AddColumnCommand(table, this.activeCell, false);
        break;
      case 'delete-row':
        command = new DeleteRowCommand(table, this.activeCell);
        break;
      case 'delete-col':
        command = new DeleteColumnCommand(table, this.activeCell);
        break;
      case 'delete-table':
        command = new DeleteTableCommand(table);
        break;
      case 'copy-table':
        command = new CopyTableCommand(table);
        break;
      case 'merge-cells':
        command = new MergeCellsCommand(table, this.activeCell);
        break;
      case 'split-cell':
        command = new SplitCellCommand(table, this.activeCell);
        break;
      case 'add-header-row':
        command = new AddHeaderRowCommand(table);
        break;
      case 'remove-header-row':
        command = new RemoveHeaderRowCommand(table);
        break;
    }

    if (command) {
      command.execute();
    }

    if (action !== 'set-background') {
      this.contextMenu.hide();
    }
  }

  public show(cell: HTMLTableCellElement, x: number, y: number): void {
    this.activeCell = cell;
    this.contextMenu.show(cell, x, y);
  }

  public hide(): void {
    this.contextMenu.hide();
    this.activeCell = null;
  }

  public destroy(): void {
    // Удаляем обработчики событий colorPicker
    if (this.colorPicker) {
      this.colorPicker.removeEventListener('input', () => {});
      this.colorPicker.removeEventListener('contextmenu', () => {});
      this.colorPicker = null;
    }

    // Уничтожаем contextMenu и popupManager, если у них есть метод destroy
    if (this.contextMenu && typeof this.contextMenu.destroy === 'function') {
      this.contextMenu.destroy();
    }
    if (this.popupManager && typeof this.popupManager.destroy === 'function') {
      this.popupManager.destroy();
    }

    // Очищаем ссылки
    this.contextMenu = null!;
    this.popupManager = null!;
    this.activeCell = null;
  }
}
