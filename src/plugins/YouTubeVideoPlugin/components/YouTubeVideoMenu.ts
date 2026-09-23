import { PopupController } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI } from '@on-codemerge/sdk';

export function extractYouTubeVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = regex.exec(url);
  return match ? match[1] : null;
}

export class YouTubeVideoMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private callback: ((videoUrl: string) => void) | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  show(callback: (videoUrl: string) => void): void {
    this.callback = callback;
    this.openDialog('', this.editor.t('youtube.insert'), this.editor.t('common.insert'));
  }

  edit(currentUrl: string, callback: (videoUrl: string) => void): void {
    this.callback = callback;
    this.openDialog(currentUrl, this.editor.t('common.edit'), this.editor.t('common.save'));
  }

  private openDialog(value: string, title: string, primaryLabel: string): void {
    const t = (k: string) => this.editor.t(k) || k;
    this.popups.open({
      title,
      className: 'youtube-video-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'input',
          id: 'youtube-url',
          label: t('youtube.youtubeVideoUrl'),
          placeholder: 'https://www.youtube.com/watch?v=...',
          value,
        },
      ],
      buttons: [
        { label: t('common.cancel'), variant: 'secondary', onClick: () => {} },
        {
          label: primaryLabel,
          variant: 'primary',
          onClick: (values) => {
            this.callback?.(String(values['youtube-url'] ?? ''));
          },
        },
      ],
    });
  }
}
