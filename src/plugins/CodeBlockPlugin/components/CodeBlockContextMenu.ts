import { ContextMenu } from '../../../core/ui/ContextMenu.ts';
import { copyIcon, formatIcon, deleteIcon, editIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class CodeBlockContextMenu {
  private contextMenu: ContextMenu;
  private activeBlock: HTMLElement | null = null;

  constructor(
    editor: HTMLEditor,
    private onEdit: (block: HTMLElement) => void
  ) {
    // Создаем контекстное меню с кнопками
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          title: editor.t('Edit'),
          icon: editIcon,
          action: 'edit',
          onClick: () => this.handleAction('edit'),
        },
        {
          title: editor.t('Copy'),
          icon: copyIcon,
          action: 'copy',
          onClick: () => this.handleAction('copy'),
        },
        {
          title: editor.t('Format'),
          icon: formatIcon,
          action: 'format',
          onClick: () => this.handleAction('format'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Remove'),
          icon: deleteIcon,
          action: 'remove',
          className: 'text-red-600',
          onClick: () => this.handleAction('remove'),
        },
      ],
      { orientation: 'vertical' } // Ориентация меню (вертикальная)
    );
  }

  private handleAction(action: string): void {
    if (!this.activeBlock) return;

    switch (action) {
      case 'edit':
        this.onEdit(this.activeBlock);
        break;
      case 'copy':
        const code = this.activeBlock.querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.textContent || '');
        }
        break;
      case 'format':
        const codeElement = this.activeBlock.querySelector('code');
        if (codeElement) {
          // Здесь можно добавить логику форматирования кода
        }
        break;
      case 'remove':
        this.activeBlock.remove();
        break;
    }
  }

  public show(block: HTMLElement, x: number, y: number): void {
    this.activeBlock = block;
    this.contextMenu.show(block, x, y); // Показываем контекстное меню
  }

  public hide(): void {
    this.contextMenu.hide(); // Скрываем контекстное меню
    this.activeBlock = null;
  }

  public destroy(): void {
    // Уничтожаем контекстное меню
    this.contextMenu.destroy();

    // Очищаем ссылки
    this.contextMenu = null!;
    this.activeBlock = null;
  }
}
