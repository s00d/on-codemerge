import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { createContainer } from '../../utils/helpers.ts';

export class ToolbarPlugin implements Plugin {
  name = 'toolbar';

  private toolbar: HTMLElement | null = null;
  private editor: HTMLEditor | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.createToolbar();
  }

  private createToolbar(): void {
    this.toolbar = createContainer('editor-toolbar');

    const editorElement = this.editor?.getDOMContext().querySelector('.html-editor');
    if (editorElement?.parentNode && this.toolbar) {
      editorElement.parentNode.insertBefore(this.toolbar, editorElement);
    }
  }

  destroy(): void {
    if (this.toolbar) {
      this.toolbar.remove(); // Удаляем тулбар из DOM
      this.toolbar = null; // Очищаем ссылку
    }
  }

  public getToolbar(): HTMLElement | null {
    return this.toolbar;
  }
}
