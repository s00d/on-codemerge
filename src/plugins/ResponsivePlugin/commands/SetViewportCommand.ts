import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Viewport } from '../types';
import type { ResponsivePlugin } from '../index';

export class SetViewportCommand implements Command {
  name = 'setViewport';
  private editor: HTMLEditor;
  private viewport: Viewport | null = null;
  private previousViewport: Viewport | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  execute(): void {
    if (!this.viewport) return;

    const container = this.editor.getContainer();
    if (!container) return;

    // Сохраняем предыдущий viewport для отмены
    const plugins = this.editor.getPlugins();
    const responsivePlugin = plugins.get('responsive') as ResponsivePlugin;
    if (responsivePlugin) {
      this.previousViewport = responsivePlugin.getCurrentViewport() as Viewport;
    }

    // Устанавливаем новый viewport
    if (responsivePlugin && responsivePlugin.viewportManager) {
      responsivePlugin.viewportManager.setViewport(container, this.viewport);
    }
  }

  undo(): void {
    if (!this.previousViewport) return;

    const container = this.editor.getContainer();
    if (!container) return;

    const plugins = this.editor.getPlugins();
    const responsivePlugin = plugins.get('responsive') as ResponsivePlugin;

    if (responsivePlugin && responsivePlugin.viewportManager) {
      responsivePlugin.viewportManager.setViewport(container, this.previousViewport);
    }
  }

  redo(): void {
    if (!this.viewport) return;

    const container = this.editor.getContainer();
    if (!container) return;

    const plugins = this.editor.getPlugins();
    const responsivePlugin = plugins.get('responsive') as ResponsivePlugin;

    if (responsivePlugin && responsivePlugin.viewportManager) {
      responsivePlugin.viewportManager.setViewport(container, this.viewport);
    }
  }
}
