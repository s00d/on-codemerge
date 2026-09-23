import { PopupController, foreign, h, mount } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { SUPPORTED_LANGUAGES } from '../constants';

export class CodeBlockModal {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private callback: ((code: string, language: string) => void) | null = null;
  private language = 'plaintext';
  private code = '';

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private languagePicker(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    return foreign((host, scope) => {
      let filter = '';
      let listEl: HTMLElement | null = null;

      const paint = () => {
        if (!listEl) {
          return;
        }
        const q = filter.trim().toLowerCase();
        for (const btn of listEl.querySelectorAll<HTMLButtonElement>('.language-option')) {
          const lang = btn.dataset.lang ?? '';
          const hidden = q.length > 0 && !lang.includes(q);
          const active = lang === this.language;
          btn.dataset.hidden = hidden ? 'true' : 'false';
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        }
      };

      const handle = mount(
        host,
        h('div', { class: 'language-selector' }, [
          h('div', { class: 'language-search' }, [
            h('input', {
              class: 'search-input',
              attrs: {
                type: 'search',
                placeholder: t('Search languages…'),
                'aria-label': t('Search languages'),
              },
              on: {
                input: (e) => {
                  filter = (e.target as HTMLInputElement).value;
                  paint();
                },
              },
            }),
          ]),
          h(
            'div',
            {
              class: 'language-list',
              attrs: { role: 'listbox', 'aria-label': t('common.language') },
            },
            SUPPORTED_LANGUAGES.map((lang) =>
              h(
                'button',
                {
                  class: 'language-option',
                  attrs: {
                    type: 'button',
                    role: 'option',
                    'data-lang': lang,
                    'aria-selected': lang === this.language ? 'true' : 'false',
                  },
                  on: {
                    click: () => {
                      this.language = lang;
                      paint();
                    },
                  },
                },
                lang
              )
            )
          ),
        ])
      );
      scope.own(handle);
      listEl = host.querySelector('.language-list');
      paint();
    });
  }

  private open(initialCode: string, initialLanguage: string): void {
    this.language = initialLanguage || 'plaintext';
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
                h('textarea', {
                  class: 'code-block-modal__code',
                  attrs: {
                    id: 'code',
                    placeholder: t('common.enterYourCodeHere'),
                    rows: '14',
                  },
                  props: { value: this.code },
                  on: {
                    input: (e) => {
                      this.code = (e.target as HTMLTextAreaElement).value;
                    },
                  },
                }),
              ]),
              h('div', { class: 'code-block-modal__side' }, [
                h('div', { class: 'code-block-modal__label' }, t('common.language')),
                this.languagePicker(),
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
    const language = this.language || 'plaintext';
    this.callback(this.code, language);
    this.popups.close();
  }

  public show(
    callback: (code: string, language: string) => void,
    initialCode = '',
    initialLanguage = 'plaintext'
  ): void {
    this.callback = callback;
    this.open(initialCode, initialLanguage);
  }
}
