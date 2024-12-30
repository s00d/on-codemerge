import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class VideoCommand implements Command {
  private dataUrl: string;

  constructor(_editor: HTMLEditor, dataUrl: string) {
    this.dataUrl = dataUrl;
  }

  execute(): void {
    const video = document.createElement('video');
    video.src = this.dataUrl;
    video.controls = true;
    video.className = 'max-w-full h-auto rounded-lg';

    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range) {
      range.deleteContents();
      range.insertNode(video);
      range.collapse(false);
    }
  }
}
