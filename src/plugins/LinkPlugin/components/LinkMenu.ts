import { PopupController } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI } from '@on-codemerge/sdk';

export interface LinkData {
  url: string;
  anchor: string;
  title: string;
  nofollow: boolean;
  targetBlank: boolean;
}

export class LinkMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private callback: ((linkData: LinkData) => void) | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  show(callback: (linkData: LinkData) => void, initialData: Partial<LinkData> = {}): void {
    this.callback = callback;
    const t = (k: string) => this.editor.t(k) || k;
    this.popups.open({
      title: t('link.insert'),
      className: 'link-menu',
      size: 'sm',
      closeOnClickOutside: true,
      items: [
        {
          type: 'input',
          id: 'link-url',
          label: t('common.url'),
          value: initialData.url ?? '',
        },
        {
          type: 'input',
          id: 'link-anchor',
          label: t('anchor.anchor'),
          value: initialData.anchor ?? '',
        },
        {
          type: 'input',
          id: 'link-title',
          label: t('common.title'),
          value: initialData.title ?? '',
        },
        {
          type: 'checkbox',
          id: 'link-nofollow',
          label: t('link.addRelNofollow'),
          value: initialData.nofollow ?? false,
        },
        {
          type: 'checkbox',
          id: 'link-blank',
          label: t('link.openInNewTabTargetBlank'),
          value: initialData.targetBlank ?? false,
        },
      ],
      buttons: [
        { label: t('common.cancel'), variant: 'secondary', onClick: () => {} },
        {
          label: t('common.insert'),
          variant: 'primary',
          onClick: (values) => {
            const linkData: LinkData = {
              url: String(values['link-url'] ?? '').trim(),
              anchor: String(values['link-anchor'] ?? '').trim(),
              title: String(values['link-title'] ?? '').trim(),
              nofollow: Boolean(values['link-nofollow']),
              targetBlank: Boolean(values['link-blank']),
            };
            if (!linkData.url) {
              return true;
            }
            this.callback?.(linkData);
            return false;
          },
        },
      ],
    });
  }
}
