import { alignCenterIcon, alignLeftIcon, alignRightIcon, deleteIcon } from '../../../icons';
import { ContextMenu } from '../../../core/ui/ContextMenu';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class YouTubeVideoContextMenu {
  private contextMenu: ContextMenu;
  private activeIframe: HTMLIFrameElement | null = null;

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
    if (!this.activeIframe) return;

    switch (action) {
      case 'align-left':
        this.activeIframe.style.float = 'left';
        this.activeIframe.style.marginRight = '1rem';
        break;
      case 'align-center':
        this.activeIframe.style.float = 'none';
        this.activeIframe.style.display = 'block';
        this.activeIframe.style.marginLeft = 'auto';
        this.activeIframe.style.marginRight = 'auto';
        break;
      case 'align-right':
        this.activeIframe.style.float = 'right';
        this.activeIframe.style.marginLeft = '1rem';
        break;
      case 'remove':
        this.activeIframe.remove();
        break;
    }
  }

  public show(iframe: HTMLIFrameElement, x: number, y: number): void {
    this.activeIframe = iframe;
    this.contextMenu.show(iframe, x, y);
  }

  public hide(): void {
    this.contextMenu.hide();
    this.activeIframe = null;
  }

  public destroy(): void {
    this.hide();
    this.contextMenu.destroy();
    this.contextMenu = null!;
    this.activeIframe = null;
  }
}
