import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createVideo } from '../../../utils/helpers.ts';

export class VideoCommand implements Command {
  private dataUrl: string;
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor, dataUrl: string) {
    this.editor = editor;
    this.dataUrl = dataUrl;
  }

  execute(): void {
    const video = createVideo('max-w-full h-auto rounded-lg');
    video.src = this.dataUrl;
    video.controls = true;

    // Используем встроенный метод insertContent для вставки видео
    this.editor.insertContent(video);
  }
}
