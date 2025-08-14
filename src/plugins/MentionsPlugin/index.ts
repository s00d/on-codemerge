import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
// no-op
import { mentionsIcon } from '../../icons';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { PopupManager, type PopupItem } from '../../core/ui/PopupManager';

export class MentionsPlugin implements Plugin {
  name = 'mentions';
  private editor: HTMLEditor | null = null;
  private popup: PopupManager | null = null;
  // query is handled by MentionsMenu
  private savedCursor: { offset: number } | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    // Build popup once (single input)
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert mention'),
      className: 'mentions-popup',
      closeOnClickOutside: true,
      items: this.buildItems(),
      buttons: [
        { label: editor.t('Cancel'), variant: 'secondary', onClick: () => this.popup?.hide() },
        { label: editor.t('Insert'), variant: 'primary', onClick: () => this.handleInsert() },
      ],
    });
    // Toolbar button (opens popup)
    const toolbar = editor.getToolbar();
    if (toolbar) {
      const btn = createToolbarButton({
        icon: mentionsIcon,
        title: editor.t('Mentions'),
        onClick: () => {
          editor.ensureEditorFocus();
          this.savedCursor = editor.saveCursorPosition();
          // Центрированная модалка (без координат)
          requestAnimationFrame(() => {
            this.popup?.show();
          });
        },
      });
      toolbar.appendChild(btn);
    }
    const container = editor.getContainer();
    container.addEventListener('input', this.onInput);
  }

  private onInput = (_e: Event): void => {
    if (!this.editor) return;
    const selection = this.editor.getTextFormatter()?.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const node = range.startContainer as Text | HTMLElement;
    const text = node.textContent || '';
    const atIndex = text.lastIndexOf('@');
    if (atIndex === -1) {
      return;
    }
    // const query = text.slice(atIndex + 1).trim(); // reserved for future validation
    // Центрированная модалка (без координат). Каретку всё равно сохраняем для корректной вставки
    this.savedCursor = this.editor.saveCursorPosition();
    this.popup?.show();
  };

  // removed dropdown; popup handles outside click itself

  private insertMentionText(value: string): void {
    if (!this.editor) return;
    // Restore caret
    if (this.savedCursor) {
      this.editor.restoreCursorPosition(this.savedCursor);
    } else {
      this.editor.ensureEditorFocus();
    }
    const selection = this.editor.getTextFormatter()?.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'mention';
    span.contentEditable = 'false';
    const normalized = value.trim().replace(/^@+/, '');
    span.dataset.userId = normalized;
    span.textContent = `@${normalized}`;
    range.insertNode(span);
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.savedCursor = null;
  }

  private buildItems(): PopupItem[] {
    return [
      {
        type: 'input',
        id: 'mention-value',
        label: this.editor?.t('User') || 'User',
        placeholder: this.editor?.t('Enter username or id') || 'Enter username or id',
        value: '',
      },
    ];
  }

  private handleInsert(): void {
    if (!this.editor || !this.popup) return;
    const value = String(this.popup.getValue('mention-value') || '').trim();
    if (!value) {
      this.popup.hide();
      return;
    }
    this.insertMentionText(value);
    this.popup.hide();
  }

  destroy(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    // Удаляем все обработчики событий
    container.removeEventListener('input', this.onInput);

    // Уничтожаем все UI компоненты
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    // Отписываемся от всех событий
    this.editor.off('mentions');
    this.editor.off('mention-insert');
    this.editor.off('mention-error');

    // Очищаем все ссылки
    this.editor = null;
    this.savedCursor = null;
  }
}
