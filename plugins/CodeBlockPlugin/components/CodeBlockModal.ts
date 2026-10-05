import { PopupController, foreign, h } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI } from '@codemerge/sdk';

import { mountSourceEditor } from '@codemerge/editor';
import type { SourceEditorHandle } from '@codemerge/editor';

export class CodeBlockModal {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private callback: ((code: string, language: string) => void) | null = null;
  private language = '';
  private code = '';
  private source: SourceEditorHandle | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private open(initialCode: string, initialLanguage: string): void {
    this.language = initialLanguage;
    this.code = initialCode;
    const t = (k: string) => this.editor.t(k) || k;
    this.popups.open({
      title: t('codeBlock.insert'),
      className: 'code-block-modal',
      size: 'lg',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'code-block-body',
          view: () =>
            h('div', { class: 'code-block-modal__body' }, [
              h('div', { class: 'code-block-modal__main' }, [
                h('label', { class: 'code-block-modal__label' }, t('Code')),
                foreign((host, scope) => {
                  host.className = 'code-block-modal__editor';
                  this.source?.destroy();
                  this.source = mountSourceEditor(host, {
                    initialText: this.code,
                    onDocChanged: () => {
                      this.code = this.source?.getText() ?? '';
                    },
                  });
                  scope.disposable(() => {
                    this.source?.destroy();
                    this.source = null;
                  });
                }),
              ]),
              h('div', { class: 'code-block-modal__side' }, [
                h('label', { class: 'code-block-modal__label' }, t('common.language')),
                h('input', {
                  class: 'code-block-modal__lang',
                  attrs: {
                    type: 'text',
                    placeholder: 'metadata only (e.g. js, python)',
                    'aria-label': t('common.language'),
                  },
                  props: { value: this.language },
                  on: {
                    input: (e) => {
                      const el = e.target;
                      this.language = el instanceof HTMLInputElement ? el.value : '';
                    },
                  },
                }),
              ]),
            ]),
        },
      ],
      buttons: [
        {
          label: t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: t('common.save'),
          variant: 'primary',
          onClick: () => {
            this.handleSubmit();
          },
        },
      ],
    });
  }

  private handleSubmit(): void {
    if (!this.callback) {
      return;
    }
    this.code = this.source?.getText() ?? this.code;
    this.callback(this.code, this.language.trim());
    this.popups.close();
  }

  public show(
    callback: (code: string, language: string) => void,
    initialCode = '',
    initialLanguage = ''
  ): void {
    this.callback = callback;
    this.open(initialCode, initialLanguage);
  }
}
