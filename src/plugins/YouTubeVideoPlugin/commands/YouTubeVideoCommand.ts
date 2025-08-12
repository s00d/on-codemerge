import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createIframe } from '../../../utils/helpers.ts';

export class YouTubeVideoCommand implements Command {
  private videoUrl: string;
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor, videoUrl: string) {
    this.editor = editor;
    this.videoUrl = videoUrl;
  }

  execute(): void {
    const videoId = this.extractYouTubeVideoId(this.videoUrl);
    if (!videoId) return;

    const iframe = createIframe('max-w-full rounded-lg p-2');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.width = '800';
    iframe.height = '400';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;

    // Используем встроенный метод insertContent для вставки YouTube видео
    this.editor.insertContent(iframe);
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
