import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createVideo } from '../../../utils/helpers.ts';

export class VideoCommand implements Command {
  private dataUrl: string;

  constructor(_editor: HTMLEditor, dataUrl: string) {
    this.dataUrl = dataUrl;
  }

  execute(): void {
    const video = createVideo('max-w-full h-auto rounded-lg');
    video.src = this.dataUrl;
    video.controls = true;

    const selection = window.getSelection(); // В Command нет доступа к editor
    const range = selection?.getRangeAt(0);

    if (range) {
      range.deleteContents();
      range.insertNode(video);
      range.collapse(false);
    }
  }
}
