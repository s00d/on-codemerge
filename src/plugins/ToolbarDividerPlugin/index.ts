import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { dividerIcon } from '../../icons';

let lastIndex = 0;

export class ToolbarDividerPlugin implements Plugin {
  name = 'toolbar-divider';
  private divider: HTMLElement | null = null;

  constructor() {
    this.name = this.name + '-' + lastIndex++;
  }

  initialize(): void {
    const toolbar = document.querySelector('.editor-toolbar');
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
    // Удаляем разделитель из DOM, если он существует
    if (this.divider && this.divider.parentElement) {
      this.divider.parentElement.removeChild(this.divider);
    }
    this.divider = null; // Очищаем ссылку
  }
}
