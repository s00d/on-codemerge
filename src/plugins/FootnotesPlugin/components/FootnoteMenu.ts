import { PopupController } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI } from '@on-codemerge/sdk';

/** Declarative footnote popup — lifetime via PopupController. */
export class FootnoteMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private callback: ((content: string) => void) | null = null;
  private value = '';

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  public show(callback: (content: string) => void, initialContent = ''): void {
    this.callback = callback;
    this.value = initialContent;
    this.popups.open({
      title: this.editor.t('footnotes.addFootnote'),
      className: 'footnote-menu',
      size: 'sm',
      closeOnClickOutside: true,
      items: [
        {
          type: 'textarea',
          id: 'footnote-textarea',
          label: this.editor.t('common.footnote'),
          value: initialContent,
          onChange: (v) => {
            this.value = String(v);
          },
        },
        {
          type: 'text',
          id: 'footnote-hint',
          value: this.editor.t(
            'common.addExplanatoryOrReferenceTextThatWillAppearAtTheBottomOfTheDocument'
          ),
        },
      ],
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: this.editor.t('common.insert'),
          variant: 'primary',
          onClick: (values) => {
            const content = String(values['footnote-textarea'] ?? this.value).trim();
            if (!content) {
              return true;
            }
            this.callback?.(content);
            return false;
          },
        },
      ],
    });
  }
}
