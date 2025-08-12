import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { alignLeftIcon, alignCenterIcon, alignRightIcon, alignJustifyIcon } from '../../icons';
export class AlignmentPlugin implements Plugin {
  name = 'alignment';
  hotkeys = [
    { keys: 'Ctrl+B', description: 'Bold text', command: 'bold', icon: '𝐁' },
    { keys: 'Ctrl+I', description: 'Italic text', command: 'italic', icon: '𝐼' },
    { keys: 'Ctrl+U', description: 'Underline text', command: 'underline', icon: 'U̲' },
    {
      keys: 'Ctrl+Shift+D',
      description: 'Strikethrough text',
      command: 'strikethrough',
      icon: 'S̶',
    },
  ];
  private editor: HTMLEditor | null = null;
  private toolbarButtons: Map<string, HTMLElement> = new Map();

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButtons();

    // Подписываемся на события выравнивания
    this.editor.on('align_left', () => {
      this.editor?.getTextFormatter()?.toggleStyle('alignLeft');
    });
    this.editor.on('align_center', () => {
      this.editor?.getTextFormatter()?.toggleStyle('alignCenter');
    });
    this.editor.on('align_right', () => {
      this.editor?.getTextFormatter()?.toggleStyle('alignRight');
    });
    this.editor.on('align_justify', () => {
      this.editor?.getTextFormatter()?.toggleStyle('alignJustify');
    });

    this.editor.on('selectionchange', () => {
      this.handleSelectionChange();
    });
  }

  private addToolbarButtons(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;

    // Массив кнопок для выравнивания
    const buttons = [
      { icon: alignLeftIcon, title: 'Align Left', command: 'alignLeft' },
      { icon: alignCenterIcon, title: 'Align Center', command: 'alignCenter' },
      { icon: alignRightIcon, title: 'Align Right', command: 'alignRight' },
      { icon: alignJustifyIcon, title: 'Align Justify', command: 'alignJustify' },
    ];

    // Создаем кнопки и добавляем их в тулбар
    buttons.forEach(({ icon, title, command }) => {
      const button = createToolbarButton({
        icon,
        title: this.editor?.t(title) || title,
        onClick: () => {
          this.editor?.getTextFormatter()?.toggleStyle(command);
          this.handleSelectionChange();
        },
      });

      toolbar.appendChild(button);
      this.toolbarButtons.set(command, button);
    });
  }

  private handleSelectionChange(): void {
    // Проверяем, какие стили применены к выделенному тексту
    this.toolbarButtons.forEach((button, style) => {
      const isActive = this.editor?.getTextFormatter()?.hasClass(style);
      if (isActive) {
        button.classList.add('active'); // Добавляем класс для активной кнопки
      } else {
        button.classList.remove('active'); // Убираем класс, если стиль не применен
      }
    });
  }

  public destroy(): void {
    this.toolbarButtons.forEach((button) => button.remove());
    this.toolbarButtons.clear();

    this.editor?.off('selectionchange');

    // Отписываемся от событий
    this.editor?.off('align_left');
    this.editor?.off('align_center');
    this.editor?.off('align_right');
    this.editor?.off('align_justify');

    this.editor = null;
  }
}
