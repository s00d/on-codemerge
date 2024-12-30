import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import { PopupManager } from '../../core/ui/PopupManager';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { fontSizeIcon, boldIcon, italicIcon, underlineIcon, strikethroughIcon } from '../../icons';
import { DEFAULT_FONT_FAMILIES, DEFAULT_FONT_SIZES } from './constants';

export class FontPlugin implements Plugin {
  name = 'font';
  private editor: HTMLEditor | null = null;
  private fontPopup: PopupManager | null = null;
  private fontFamilies: string[] = [];
  private font = 'Arial';
  private size = '16px';
  private toolbarButtons: HTMLElement[] = [];

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.fontFamilies = this.getAvailableFonts(); // Получаем список шрифтов
    this.fontPopup = new PopupManager(editor, {
      title: editor.t('Font Settings'),
      className: 'font-popup',
      closeOnClickOutside: true,
      items: [
        {
          type: 'list',
          id: 'font-family',
          label: editor.t('Font Family'),
          options: this.fontFamilies,
          value: this.font,
          onChange: (value) => (this.font = value.toString()),
        },
        {
          type: 'list',
          id: 'font-size',
          label: editor.t('Font Size'),
          options: DEFAULT_FONT_SIZES,
          value: this.size,
          onChange: (value) => (this.size = value.toString()),
        },
      ],
      buttons: [
        {
          label: editor.t('Confirm'),
          variant: 'primary',
          onClick: () => this.applyFontSettings(),
        },
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.fontPopup?.hide(),
        },
      ],
    });

    this.addToolbarButtons();

    this.editor.on('bold', () => {
      this.toggleFontStyle('bold');
    });
    this.editor.on('italic', () => {
      this.toggleFontStyle('italic');
    });
    this.editor.on('underline', () => {
      this.toggleFontStyle('underline');
    });
    this.editor.on('strikethrough', () => {
      this.toggleFontStyle('strikethrough');
    });
  }

  private getAvailableFonts(): string[] {
    // Получаем загруженные шрифты через document.fonts
    const loadedFonts = this.getLoadedFonts();

    // Объединяем стандартные и загруженные шрифты, удаляем дубликаты
    return [...new Set([...DEFAULT_FONT_FAMILIES, ...loadedFonts])];
  }

  private getLoadedFonts(): string[] {
    const fonts = new Set<string>();
    document.fonts.forEach((fontFace) => {
      fonts.add(fontFace.family);
    });
    return Array.from(fonts);
  }

  private setFontFamily(fontFamily: string): void {
    if (this.editor) {
      document.execCommand('fontName', false, fontFamily);
    }
  }

  private setFontSize(fontSize: string): void {
    if (this.editor) {
      document.execCommand('fontSize', false, fontSize.replace('px', ''));
    }
  }

  private applyFontSettings(): void {
    if (this.fontPopup) {
      this.setFontFamily(this.font);
      this.setFontSize(this.size);

      this.fontPopup.hide();
    }
  }

  private addToolbarButtons(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    // Font family button
    const fontFamilyButton = createToolbarButton({
      icon: fontSizeIcon,
      title: 'Font Family',
      onClick: () => {
        this.fontPopup?.show();
      },
    });

    const boldButton = createToolbarButton({
      icon: boldIcon,
      title: this.editor?.t('Bold'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.toggleFontStyle('bold');
      },
    });

    // Italic button
    const italicButton = createToolbarButton({
      icon: italicIcon,
      title: this.editor?.t('Italic'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.toggleFontStyle('italic');
      },
    });

    // Underline button
    const underlineButton = createToolbarButton({
      icon: underlineIcon,
      title: this.editor?.t('Underline'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.toggleFontStyle('underline');
      },
    });

    // Strikethrough button
    const strikethroughButton = createToolbarButton({
      icon: strikethroughIcon,
      title: this.editor?.t('Strikethrough'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.toggleFontStyle('strikethrough');
      },
    });

    toolbar.appendChild(fontFamilyButton);
    toolbar.appendChild(boldButton);
    toolbar.appendChild(italicButton);
    toolbar.appendChild(underlineButton);
    toolbar.appendChild(strikethroughButton);

    // Сохраняем кнопки для последующего удаления
    this.toolbarButtons.push(
      fontFamilyButton,
      boldButton,
      italicButton,
      underlineButton,
      strikethroughButton
    );
  }

  private toggleFontStyle(style: 'bold' | 'italic' | 'underline' | 'strikethrough'): void {
    if (!this.editor) return;

    this.editor.ensureEditorFocus();

    // Execute the corresponding command
    const command = (() => {
      switch (style) {
        case 'bold':
          return 'bold';
        case 'italic':
          return 'italic';
        case 'underline':
          return 'underline';
        case 'strikethrough':
          return 'strikethrough';
        default:
          throw new Error(`Unsupported font style: ${style}`);
      }
    })();

    document.execCommand(command, false);
  }

  destroy(): void {
    // Удаляем кнопки из тулбара
    this.toolbarButtons.forEach((button) => button.remove());
    this.toolbarButtons = [];

    // Уничтожаем всплывающее окно
    if (this.fontPopup) {
      this.fontPopup.destroy();
      this.fontPopup = null;
    }

    // Отписываемся от событий редактора
    if (this.editor) {
      this.editor.off('bold');
      this.editor.off('italic');
      this.editor.off('underline');
      this.editor.off('strikethrough');
      this.editor = null;
    }
  }
}
