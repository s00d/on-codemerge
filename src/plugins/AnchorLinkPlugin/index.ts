import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { anchorAddIcon } from '../../icons';
import { PopupManager, type PopupItem } from '../../core/ui/PopupManager';

export class AnchorLinkPlugin implements Plugin {
  name = 'anchor-links';
  private editor: HTMLEditor | null = null;
  private popup: PopupManager | null = null;
  private savedCursor: { offset: number } | null = null;
  private savedSelectedText: string = '';

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButton();
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert Anchor'),
      className: 'anchor-popup',
      items: this.items(),
      buttons: [
        { label: editor.t('Cancel'), variant: 'secondary', onClick: () => this.popup?.hide() },
        { label: editor.t('Insert'), variant: 'primary', onClick: () => this.insert() },
      ],
    });
  }

  private items(): PopupItem[] {
    return [
      { type: 'input', id: 'anchor-id', label: this.editor?.t('Anchor ID') || 'Anchor ID' },
      { type: 'input', id: 'anchor-text', label: this.editor?.t('Text') || 'Text' },
    ];
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;
    const button = createToolbarButton({
      icon: anchorAddIcon,
      title: this.editor?.t('Insert Anchor'),
      onClick: () => {
        if (!this.editor) return;
        // Сохраняем выделение/курсор до открытия попапа
        const selection = this.editor.getTextFormatter()?.getSelection();
        this.savedSelectedText = selection?.toString() || '';
        this.savedCursor = this.editor.saveCursorPosition();
        this.popup?.show();
      },
    });
    toolbar.appendChild(button);
  }

  private insert(): void {
    if (!this.editor || !this.popup) return;
    let id = String(this.popup.getValue('anchor-id') || '').trim();
    const text = String(this.popup.getValue('anchor-text') || '').trim();
    if (!id) {
      id = this.slugify((this.savedSelectedText || '').trim() || 'section');
    }

    // Восстанавливаем курсор в редактор перед вставкой
    if (this.savedCursor) {
      this.editor.restoreCursorPosition(this.savedCursor);
    } else {
      this.editor.ensureEditorFocus();
    }

    const selection = this.editor.getTextFormatter()?.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const a = document.createElement('a');
    a.id = id;
    a.href = `#${id}`;
    a.textContent = text || `#${id}`;
    a.className = 'anchor-link';
    const editorContainer = this.editor.getContainer();
    const isInsideEditor =
      !!range &&
      editorContainer.contains(range.startContainer) &&
      editorContainer.contains(range.endContainer);

    if (range && isInsideEditor) {
      range.insertNode(a);
      range.setStartAfter(a);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      this.editor.insertContent(a);
    }
    this.popup.hide();

    // Очищаем сохраненное состояние
    this.savedCursor = null;
    this.savedSelectedText = '';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  destroy(): void {
    // Уничтожаем все UI компоненты
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    // Отписываемся от всех событий
    this.editor?.off('anchor-link');
    this.editor?.off('anchor-insert');
    this.editor?.off('anchor-error');

    // Очищаем все ссылки
    this.editor = null;
    this.savedCursor = null;
    this.savedSelectedText = '';
  }
}
