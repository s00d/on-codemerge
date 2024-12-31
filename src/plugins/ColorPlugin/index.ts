import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ColorPicker } from './components/ColorPicker';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { textColorIcon, backgroundColorIcon } from '../../icons';

export class ColorPlugin implements Plugin {
  name = 'color';
  private editor: HTMLEditor | null = null;
  private textColorPicker: ColorPicker | null = null;
  private bgColorPicker: ColorPicker | null = null;
  private textColorButton: HTMLElement | null = null; // Храним ссылку на кнопку текстового цвета
  private bgColorButton: HTMLElement | null = null; // Храним ссылку на кнопку фонового цвета

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.textColorPicker = new ColorPicker(editor, editor.t('Text Color'));
    this.bgColorPicker = new ColorPicker(editor, editor.t('Background Color'));

    this.editor = editor;
    this.addToolbarButtons();
    this.editor.on('fore-color', () => {
      this.showTextColorPicker();
    });
    this.editor.on('hilite-color', () => {
      this.showBgColorPicker();
    });
  }

  private showTextColorPicker() {
    this.textColorPicker?.show((color) => {
      if (this.editor) {
        this.editor.getContainer().focus();
        document.execCommand('foreColor', false, color);
      }
    });
  }

  private showBgColorPicker() {
    this.bgColorPicker?.show((color) => {
      if (this.editor) {
        this.editor.getContainer().focus();
        document.execCommand('hiliteColor', false, color);
      }
    });
  }

  private addToolbarButtons(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    // Text color button with "A" icon
    this.textColorButton = createToolbarButton({
      icon: textColorIcon,
      title: this.editor?.t('Text Color') ?? 'Text Color',
      onClick: () => {
        this.showTextColorPicker();
      },
    });

    // Background color button with filled square icon
    this.bgColorButton = createToolbarButton({
      icon: backgroundColorIcon,
      title: this.editor?.t('Background Color') ?? 'Background Color',
      onClick: () => {
        this.showBgColorPicker();
      },
    });

    toolbar.appendChild(this.textColorButton);
    toolbar.appendChild(this.bgColorButton);
  }

  public destroy(): void {
    if (this.textColorButton && this.textColorButton.parentElement) {
      this.textColorButton.parentElement.removeChild(this.textColorButton);
    }
    if (this.bgColorButton && this.bgColorButton.parentElement) {
      this.bgColorButton.parentElement.removeChild(this.bgColorButton);
    }

    this.textColorButton = null;
    this.bgColorButton = null;

    this.textColorPicker?.destroy();
    this.bgColorPicker?.destroy();

    this.textColorPicker = null;
    this.bgColorPicker = null;

    this.editor?.off('foreColor');
    this.editor?.off('hiliteColor');

    this.editor = null;
  }
}
