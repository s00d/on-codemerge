import { alignCenterIcon, alignLeftIcon, alignRightIcon, deleteIcon } from '../../../icons';
import { ContextMenu } from '../../../core/ui/ContextMenu.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class ImageContextMenu {
  private contextMenu: ContextMenu;
  private activeImage: HTMLImageElement | null = null;

  constructor(editor: HTMLEditor) {
    // Создаем контекстное меню с кнопками
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          label: editor.t('Align Left'),
          icon: alignLeftIcon,
          action: 'align-left',
          onClick: () => this.handleAction('align-left'),
        },
        {
          label: editor.t('Align Center'),
          icon: alignCenterIcon,
          action: 'align-center',
          onClick: () => this.handleAction('align-center'),
        },
        {
          label: editor.t('Align Right'),
          icon: alignRightIcon,
          action: 'align-right',
          onClick: () => this.handleAction('align-right'),
        },
        {
          type: 'divider',
        },
        {
          label: editor.t('Remove'),
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
    if (!this.activeImage) return;

    switch (action) {
      case 'align-left':
        this.activeImage.style.float = 'left';
        this.activeImage.style.marginRight = '1rem';
        break;
      case 'align-center':
        this.activeImage.style.float = 'none';
        this.activeImage.style.display = 'block';
        this.activeImage.style.marginLeft = 'auto';
        this.activeImage.style.marginRight = 'auto';
        break;
      case 'align-right':
        this.activeImage.style.float = 'right';
        this.activeImage.style.marginLeft = '1rem';
        break;
      case 'remove':
        this.activeImage.remove();
        break;
    }
  }

  public show(image: HTMLImageElement, x: number, y: number): void {
    this.activeImage = image;
    this.contextMenu.show(image, x, y); // Показываем контекстное меню
  }

  public hide(): void {
    this.contextMenu.hide(); // Скрываем контекстное меню
    this.activeImage = null;
  }

  public destroy(): void {
    // Уничтожаем контекстное меню
    this.contextMenu.destroy();

    // Очищаем ссылки
    this.contextMenu = null!;
    this.activeImage = null;
  }
}
