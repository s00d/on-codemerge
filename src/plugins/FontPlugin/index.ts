import type { HTMLEditor } from '../../core/HTMLEditor';
import { fontSizeIcon, boldIcon, italicIcon, underlineIcon, strikethroughIcon } from '../../icons';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { DEFAULT_FONT_FAMILIES, DEFAULT_FONT_SIZES, DEFAULT_LINE_HEIGHTS } from './constants';
import type { Plugin } from '../../core/Plugin';
import { PopupManager } from '../../core/ui/PopupManager';

export class FontPlugin implements Plugin {
  name = 'font';
  private editor: HTMLEditor | null = null;
  private toolbarButtons: Map<string, HTMLElement> = new Map();
  private fontButtons: Map<string, HTMLElement> = new Map();
  private fontPopup: PopupManager | null = null;
  private fontFamilies: string[] = [];
  private font = 'Arial';
  private size = '16px';
  private lineHeight = 'normal';

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    // const container = editor.getContainer();
    this.fontFamilies = this.getAvailableFonts();
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
        {
          type: 'list',
          id: 'line-height',
          label: editor.t('Line Height'),
          options: DEFAULT_LINE_HEIGHTS,
          value: this.lineHeight,
          onChange: (value) => (this.lineHeight = value.toString()),
        },
      ],
      buttons: [
        {
          label: editor.t('Confirm'),
          variant: 'primary',
          onClick: () => this.applyFontSettings(),
        },
        {
          label: editor.t('Clear'),
          variant: 'danger',
          onClick: () => this.clearFontSettings(),
        },
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.fontPopup?.hide(),
        },
      ],
    });
    this.addToolbarButtons();
    this.editor.on('selectionchange', () => this.handleSelectionChange());
  }

  private addToolbarButtons(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    const buttons = [
      { icon: boldIcon, title: 'Bold', style: 'bold' },
      { icon: italicIcon, title: 'Italic', style: 'italic' },
      { icon: underlineIcon, title: 'Underline', style: 'underline' },
      { icon: strikethroughIcon, title: 'Strikethrough', style: 'strikethrough' },
    ];

    buttons.forEach(({ icon, title, style }) => {
      const button = createToolbarButton({
        icon,
        title,
        onClick: () => {
          this.editor?.getTextFormatter()?.toggleStyle(style);
          this.handleSelectionChange();
        },
      });
      toolbar.appendChild(button);
      this.toolbarButtons.set(style, button);
    });

    const fontSettingsButton = createToolbarButton({
      icon: fontSizeIcon,
      title: this.editor?.t('Font Settings'),
      onClick: () => {
        let fontFamily = this.editor?.getTextFormatter()?.getStyle('fontFamily');
        if (fontFamily === '') fontFamily = null;
        this.fontPopup?.setValue('font-family', fontFamily ?? 'Arial');
        let fontSize = this.editor?.getTextFormatter()?.getStyle('fontSize');
        if (fontSize === '') fontSize = null;
        this.fontPopup?.setValue('font-size', fontSize ?? '16px');
        let lineHeight = this.editor?.getTextFormatter()?.getStyle('lineHeight');
        if (lineHeight === '') lineHeight = null;
        this.fontPopup?.setValue('line-height', lineHeight ?? 'normal');
        this.fontPopup?.show();
      },
    });
    toolbar.appendChild(fontSettingsButton);
    this.fontButtons.set('fontSize', fontSettingsButton);
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

  private getAvailableFonts(): string[] {
    const loadedFonts = this.getLoadedFonts();
    return [...new Set([...DEFAULT_FONT_FAMILIES, ...loadedFonts])];
  }

  private getLoadedFonts(): string[] {
    const fonts = new Set<string>();
    document.fonts.forEach((fontFace) => {
      fonts.add(fontFace.family);
    });
    return Array.from(fonts);
  }

  private applyFontSettings(): void {
    this.editor?.getTextFormatter()?.setFont(this.font, this.size, this.lineHeight);
    if (this.fontPopup) {
      this.fontPopup.hide();
    }
  }

  private clearFontSettings(): void {
    this.editor?.getTextFormatter()?.clearFont();
    if (this.fontPopup) {
      this.fontPopup.hide();
    }
  }

  destroy(): void {
    this.toolbarButtons.forEach((button) => button.remove());
    this.toolbarButtons.clear();
    this.fontButtons.forEach((button) => button.remove());
    this.fontButtons.clear();

    this.editor?.off('selectionchange');

    this.fontPopup?.destroy();
    this.fontPopup = null;

    this.editor = null;
  }
}
