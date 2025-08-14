import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { dividerIcon } from '../../icons';
import type { HTMLEditor } from '../../core/HTMLEditor.ts';

let lastIndex = 0;

export class ToolbarDividerPlugin implements Plugin {
  name = 'toolbar-divider';
  private divider: HTMLElement | null = null;
  private editor: HTMLEditor | null = null;

  constructor() {
    this.name = this.name + '-' + lastIndex++;
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    const toolbar = this.editor.getToolbar();
    if (!toolbar) return;

    // Создаем разделитель
    this.divider = createToolbarButton({
      icon: dividerIcon,
      title: '',
      onClick: () => {}, // Разделитель не требует действия
      disabled: true, // Делаем разделитель неинтерактивным
    });

    // Добавляем стили для разделителя
    this.divider.classList.add('toolbar-divider');

    // Добавляем разделитель в тулбар
    toolbar.appendChild(this.divider);
  }

  destroy(): void {
    if (!this.editor) return;

    // Удаляем разделитель из DOM, если он существует
    if (this.divider) {
      this.divider.remove();
      this.divider = null;
    }

    // Очищаем ссылку на редактор
    this.editor = null;
  }
}
