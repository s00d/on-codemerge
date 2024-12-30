import { PopupManager, type PopupItem } from '../../../core/ui/PopupManager';
import { TYPOGRAPHY_STYLES } from '../constants';
import { clearIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class TypographyMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private onSelect: ((style: string) => void) | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      title: editor.t('Typography Styles'),
      className: 'typography-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
      ],
      items: this.createPopupItems(), // Динамически создаем элементы
    });
  }

  private createPopupItems(): PopupItem[] {
    const items: PopupItem[] = [];

    // Кнопка для очистки форматирования
    items.push({
      type: 'button',
      id: 'typography-clear',
      text: this.editor.t('Clear Formatting'),
      buttonVariant: 'primary',
      icon: clearIcon,
      value: 'clear',
      onChange: (value) => {
        this.onSelect?.(value.toString());
        this.popup.hide();
      },
    });

    // Разделитель
    items.push({
      type: 'divider',
      id: 'typography-divider',
    });

    // Кнопки для стилей
    TYPOGRAPHY_STYLES.forEach((style) => {
      items.push({
        type: 'button',
        id: `typography-${style.value}`,
        text: this.editor.t(style.label),
        buttonVariant: 'secondary',
        icon: style.icon,
        value: style.value,
        className: style.preview,
        onChange: (value) => {
          this.onSelect?.(value.toString());
          this.popup.hide();
        },
      });
    });

    return items;
  }

  public show(onSelect: (style: string) => void): void {
    this.onSelect = onSelect;
    this.popup.show();
  }

  public destroy(): void {
    // Уничтожаем PopupManager
    this.popup.destroy();

    // Очищаем ссылки
    this.editor = null!;
    this.popup = null!;
    this.onSelect = null;
  }
}
