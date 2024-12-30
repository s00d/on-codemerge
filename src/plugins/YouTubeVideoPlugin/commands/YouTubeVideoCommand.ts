import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class YouTubeVideoCommand implements Command {
  private videoUrl: string;

  constructor(_editor: HTMLEditor, videoUrl: string) {
    this.videoUrl = videoUrl;
  }

  execute(): void {
    const videoId = this.extractYouTubeVideoId(this.videoUrl);
    if (!videoId) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.width = '800';
    iframe.height = '400';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.className = 'max-w-full rounded-lg p-2';

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range) {
      range.deleteContents();
      range.insertNode(iframe);
      range.collapse(false);
    }
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
