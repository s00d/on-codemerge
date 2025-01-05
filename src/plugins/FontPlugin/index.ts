import type { HTMLEditor } from '../../core/HTMLEditor';
import { fontSizeIcon, boldIcon, italicIcon, underlineIcon, strikethroughIcon } from '../../icons';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { DEFAULT_FONT_FAMILIES, DEFAULT_FONT_SIZES } from './constants';
import type { Plugin } from '../../core/Plugin';
import { PopupManager } from '../../core/ui/PopupManager';
import { TextFormatter } from '../../utils/TextFormatter';

export class FontPlugin implements Plugin {
  name = 'font';
  private editor: HTMLEditor | null = null;
  private toolbarButtons: Map<string, HTMLElement> = new Map();
  private fontButtons: Map<string, HTMLElement> = new Map();
  private fontPopup: PopupManager | null = null;
  private fontFamilies: string[] = [];
  private font = 'Arial';
  private size = '16px';
  private textFormatter: TextFormatter | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.textFormatter = new TextFormatter(editor.getContainer()); // Инициализируем TextFormatter
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
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }

  private addToolbarButtons(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar || !this.textFormatter) return;

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
          if (this.textFormatter) {
            this.textFormatter.toggleStyle(style);
            this.handleSelectionChange();
          }
        },
      });
      toolbar.appendChild(button);
      this.toolbarButtons.set(style, button);
    });

    const fontSettingsButton = createToolbarButton({
      icon: fontSizeIcon,
      title: this.editor?.t('Font Settings'),
      onClick: () => this.fontPopup?.show(),
    });
    toolbar.appendChild(fontSettingsButton);
    this.fontButtons.set('fontSize', fontSettingsButton);
  }

  private handleSelectionChange(): void {
    if (!this.textFormatter) return;

    // Проверяем, какие стили применены к выделенному тексту
    this.toolbarButtons.forEach((button, style) => {
      const isActive = this.textFormatter?.hasStyle(style);
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
    if (this.fontPopup && this.textFormatter) {
      this.textFormatter.setFontFamily(this.font);
      this.textFormatter.setFontSize(this.size);
      this.fontPopup.hide();
    }
  }

  destroy(): void {
    this.toolbarButtons.forEach((button) => button.remove());
    this.toolbarButtons.clear();
    this.fontButtons.forEach((button) => button.remove());
    this.fontButtons.clear();

    this.fontPopup?.destroy();
    this.fontPopup = null;

    this.editor = null;
    this.textFormatter = null;
  }
}
