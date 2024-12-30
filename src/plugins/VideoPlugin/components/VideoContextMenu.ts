import { alignCenterIcon, alignLeftIcon, alignRightIcon, deleteIcon } from '../../../icons';
import { ContextMenu } from '../../../core/ui/ContextMenu.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class VideoContextMenu {
  private contextMenu: ContextMenu;
  private activeVideo: HTMLVideoElement | null = null;

  constructor(editor: HTMLEditor) {
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
          label: editor.t('Delete'),
          icon: deleteIcon,
          action: 'remove',
          className: 'text-red-600',
          onClick: () => this.handleAction('remove'),
        },
      ],
      { orientation: 'vertical' }
    );
  }

  private handleAction(action: string): void {
    if (!this.activeVideo) return;

    switch (action) {
      case 'align-left':
        this.activeVideo.style.float = 'left';
        this.activeVideo.style.marginRight = '1rem';
        break;
      case 'align-center':
        this.activeVideo.style.float = 'none';
        this.activeVideo.style.display = 'block';
        this.activeVideo.style.marginLeft = 'auto';
        this.activeVideo.style.marginRight = 'auto';
        break;
      case 'align-right':
        this.activeVideo.style.float = 'right';
        this.activeVideo.style.marginLeft = '1rem';
        break;
      case 'remove':
        this.activeVideo.remove();
        break;
    }
  }

  public show(video: HTMLVideoElement, x: number, y: number): void {
    this.activeVideo = video;
    this.contextMenu.show(video, x, y);
  }

  public hide(): void {
    this.contextMenu.hide();
    this.activeVideo = null;
  }

  public destroy(): void {
    // Скрываем меню, если оно открыто
    this.hide();

    // Уничтожаем контекстное меню (предполагается, что у ContextMenu есть метод destroy)
    if (this.contextMenu.destroy) {
      this.contextMenu.destroy();
    }

    // Очищаем ссылки
    this.contextMenu = null!;
    this.activeVideo = null;
  }
}
