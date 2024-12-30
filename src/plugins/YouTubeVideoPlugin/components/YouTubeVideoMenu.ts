import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class YouTubeVideoMenu {
  private popup: PopupManager;
  private callback: ((videoUrl: string) => void) | null = null;
  private url = '';

  constructor(editor: HTMLEditor) {
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert YouTube Video'),
      className: 'youtube-video-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
        {
          label: editor.t('Insert'),
          variant: 'primary',
          onClick: () => this.handleSubmit(),
        },
      ],
      items: [
        {
          type: 'input',
          id: 'youtube-url',
          label: editor.t('YouTube Video URL'),
          placeholder: 'https://www.youtube.com/watch?v=...',
          onChange: (value) => (this.url = value.toString()),
        },
      ],
    });
  }

  private handleSubmit(): void {
    if (this.callback) {
      this.callback(this.url);
      this.popup.hide();
    }
  }

  public show(callback: (videoUrl: string) => void): void {
    this.callback = callback;
    this.popup.show();
    this.popup.setFocus('youtube-url');
  }

  public destroy(): void {
    this.popup.destroy();

    this.popup = null!;
    this.callback = null;
  }
}
