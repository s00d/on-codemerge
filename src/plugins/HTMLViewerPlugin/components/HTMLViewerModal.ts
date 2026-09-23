import { PopupController, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { copyIcon, saveIcon } from '../../../icons';

export class HTMLViewerModal {
  private readonly editor: EditorAPI;
  private mode: 'view' | 'edit' = 'view';
  private html = '';

  private readonly popups: PopupController;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private body(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    return h('div', { class: 'html-viewer-body' }, [
      h('div', { class: 'modal-header' }, [
        h('div', { class: 'text-lg font-semibold' }, t('htmlViewer.source')),
        this.mode === 'view'
          ? h(
              'button',
              {
                class: 'copy-button',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    void navigator.clipboard.writeText(this.html);
                    this.editor.notify(t('common.copied'));
                  },
                },
              },
              h('span', { props: { innerHTML: copyIcon } }),
              ` ${t('common.copy')}`
            )
          : h(
              'button',
              {
                class: 'save-button',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    this.editor.setHTML(this.html);
                    this.mode = 'view';
                    this.show(this.html);
                  },
                },
              },
              h('span', { props: { innerHTML: saveIcon } }),
              ` ${t('common.save')}`
            ),
      ]),
      h('div', { class: 'tabs' }, [
        h(
          'button',
          {
            class: this.mode === 'view' ? 'tab active' : 'tab',
            attrs: { type: 'button' },
            on: {
              click: () => {
                this.mode = 'view';
                this.show(this.html);
              },
            },
          },
          t('common.view')
        ),
        h(
          'button',
          {
            class: this.mode === 'edit' ? 'tab active' : 'tab',
            attrs: { type: 'button' },
            on: {
              click: () => {
                this.mode = 'edit';
                this.show(this.html);
              },
            },
          },
          t('common.edit')
        ),
      ]),
      this.mode === 'view'
        ? h('pre', { class: 'view-container' }, [
            h('code', { class: 'html-content', ref: 'code' }, this.html),
          ])
        : h('textarea', {
            class: 'html-edit w-full border border-gray-300 rounded-lg p-2',
            attrs: { rows: 10 },
            props: { value: this.html },
            on: {
              input: (e) => {
                const textarea = e.target;
                if (!(textarea instanceof HTMLTextAreaElement)) {
                  return;
                }
                this.html = textarea.value;
              },
            },
          }),
    ]);
  }

  show(html: string): void {
    this.html = html;
    this.popups.open({
      className: 'html-viewer-modal',
      size: 'lg',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'html-viewer-content',
          view: () => this.body(),
        },
      ],
    });
  }
}
