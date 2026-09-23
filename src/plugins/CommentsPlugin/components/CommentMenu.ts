import { PopupController } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI } from '@on-codemerge/sdk';

/** Declarative comment popup — lifetime via PopupController. */
export class CommentMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private callback: ((content: string, action: 'save' | 'delete') => void) | null = null;
  private draft = '';
  private showDelete = false;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private open(): void {
    const buttons: {
      label: string;
      variant: 'primary' | 'secondary' | 'danger';
      onClick: (values: Record<string, string | boolean | number>) => void | boolean;
    }[] = [
      {
        label: this.editor.t('common.cancel'),
        variant: 'secondary',
        onClick: () => {},
      },
      {
        label: this.editor.t('common.save'),
        variant: 'primary',
        onClick: (values) => {
          const content = String(values['comment-text'] ?? this.draft).trim();
          if (!content) {
            return true;
          }
          this.callback?.(content, 'save');
          return false;
        },
      },
    ];
    if (this.showDelete) {
      buttons.splice(1, 0, {
        label: this.editor.t('comments.deleteComment'),
        variant: 'danger',
        onClick: () => {
          this.callback?.('', 'delete');
          return false;
        },
      });
    }

    this.popups.open({
      title: this.editor.t('comments.insert'),
      className: 'comment-menu',
      size: 'sm',
      closeOnClickOutside: true,
      items: [
        {
          type: 'textarea',
          id: 'comment-text',
          label: this.editor.t('comments.comment'),
          placeholder: this.editor.t('comments.addYourComment'),
          value: this.draft,
          onChange: (v) => {
            this.draft = String(v);
          },
        },
        {
          type: 'text',
          id: 'comment-hint',
          value: this.editor.t('comments.useCommentsToProvideFeedbackOrSuggestions'),
        },
      ],
      buttons,
    });
  }

  public show(
    callback: (content: string, action: 'save' | 'delete') => void,
    initialContent = '',
    showDelete = false
  ): void {
    this.callback = callback;
    this.draft = initialContent;
    this.showDelete = showDelete;
    this.open();
  }
}
