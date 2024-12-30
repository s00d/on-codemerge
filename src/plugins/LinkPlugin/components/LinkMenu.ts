import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class LinkMenu {
  private popup: PopupManager;
  private callback: ((linkData: LinkData) => void) | null = null;

  // Ссылки на элементы
  private url = '';
  private anchor = '';
  private title = '';
  private nofollowCheckbox = false;
  private targetBlankCheckbox = false;

  constructor(editor: HTMLEditor) {
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert Link'),
      className: 'link-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
        {
          label: editor.t('Insert'),
          variant: 'primary',
          onClick: () => this.handleSubmit(),
        },
      ],
      items: [
        {
          type: 'input',
          id: 'link-url',
          label: editor.t('URL'),
          value: this.url,
          onChange: (value) => (this.url = value.toString()),
        },
        {
          type: 'input',
          id: 'link-anchor',
          label: editor.t('Anchor'),
          value: this.anchor,
          onChange: (value) => (this.anchor = value.toString()),
        },
        {
          type: 'input',
          id: 'link-title',
          label: editor.t('Title'),
          value: this.title,
          onChange: (value) => (this.title = value.toString()),
        },
        {
          type: 'checkbox',
          id: 'link-nofollow',
          label: editor.t('Add rel="nofollow"'),
          value: this.nofollowCheckbox,
          onChange: (value) => (this.nofollowCheckbox = value as boolean),
        },
        {
          type: 'checkbox',
          id: 'link-blank',
          label: editor.t('Open in new tab (target="_blank")'),
          value: this.targetBlankCheckbox,
          onChange: (value) => (this.targetBlankCheckbox = value as boolean),
        },
      ],
    });
  }

  private handleSubmit(): void {
    const linkData: LinkData = {
      url: this.url.trim(),
      anchor: this.anchor.trim(),
      title: this.title.trim(),
      nofollow: this.nofollowCheckbox,
      targetBlank: this.targetBlankCheckbox,
    };

    if (linkData.url) {
      if (this.callback) {
        this.callback(linkData);
      }
      this.popup.hide();
    }
  }

  public show(callback: (linkData: LinkData) => void, initialData: Partial<LinkData> = {}): void {
    this.callback = callback;

    this.popup.setValue('link-url', initialData.url || '');
    this.popup.setValue('link-anchor', initialData.anchor || '');
    this.popup.setValue('link-title', initialData.title || '');
    this.popup.setValue('link-blank', initialData.targetBlank || '');
    this.popup.setValue('link-nofollow', initialData.nofollow || '');

    this.url = initialData.url || '';
    this.anchor = initialData.anchor || '';
    this.title = initialData.title || '';
    this.nofollowCheckbox = initialData.nofollow || false;
    this.targetBlankCheckbox = initialData.targetBlank || false;

    this.popup.show();
    this.popup.setFocus('link-url');
  }
}

interface LinkData {
  url: string;
  anchor: string;
  title: string;
  nofollow: boolean;
  targetBlank: boolean;
}
