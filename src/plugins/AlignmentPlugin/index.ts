import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { alignLeftIcon, alignCenterIcon, alignRightIcon, alignJustifyIcon } from '../../icons';

export class AlignmentPlugin implements Plugin {
  name = 'alignment';
  private editor: HTMLEditor | null = null;
  private buttons: HTMLElement[] = []; // Хранилище для кнопок, созданных плагином

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButtons();

    this.editor.on('align_left', () => {
      this.editor?.ensureEditorFocus();
      this.applyAlignment('left');
    });

    this.editor.on('align_center', () => {
      this.editor?.ensureEditorFocus();
      this.applyAlignment('center');
    });

    this.editor.on('align_right', () => {
      this.editor?.ensureEditorFocus();
      this.applyAlignment('right');
    });
    this.editor.on('align_justify', () => {
      this.editor?.ensureEditorFocus();
      this.applyAlignment('justify');
    });
  }

  private addToolbarButtons(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    // Left align button
    const leftAlignButton = createToolbarButton({
      icon: alignLeftIcon,
      title: this.editor?.t('Align Left'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.applyAlignment('left');
      },
    });

    // Center align button
    const centerAlignButton = createToolbarButton({
      icon: alignCenterIcon,
      title: this.editor?.t('Align Center'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.applyAlignment('center');
      },
    });

    // Right align button
    const rightAlignButton = createToolbarButton({
      icon: alignRightIcon,
      title: this.editor?.t('Align Right'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.applyAlignment('right');
      },
    });

    // Justify align button
    const justifyAlignButton = createToolbarButton({
      icon: alignJustifyIcon,
      title: this.editor?.t('Align Justify'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.applyAlignment('justify');
      },
    });

    // Добавляем кнопки в тулбар и сохраняем их в массиве
    toolbar.appendChild(leftAlignButton);
    toolbar.appendChild(centerAlignButton);
    toolbar.appendChild(rightAlignButton);
    toolbar.appendChild(justifyAlignButton);

    this.buttons.push(leftAlignButton, centerAlignButton, rightAlignButton, justifyAlignButton);
  }

  private applyAlignment(alignment: 'left' | 'center' | 'right' | 'justify'): void {
    if (!this.editor) return;

    this.editor.ensureEditorFocus();

    const command = `justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
    document.execCommand(command, false);
  }

  public destroy(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      this.buttons.forEach((button) => {
        toolbar.removeChild(button);
      });
    }

    this.editor?.off('align_left');
    this.editor?.off('align_center');
    this.editor?.off('align_right');
    this.editor?.off('align_justify');

    this.buttons = [];
    this.editor = null;
  }
}
