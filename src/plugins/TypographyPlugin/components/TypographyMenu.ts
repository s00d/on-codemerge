import { PopupController, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { TYPOGRAPHY_STYLES } from '../constants';
import type { TypographyStyle } from '../constants';
import { clearIcon } from '../../../icons';

export class TypographyMenu {
  private readonly editor: EditorAPI;
  private onSelect: ((style: string) => void) | null = null;
  private readonly popups: PopupController;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private t(key: string): string {
    return this.editor.t(key);
  }

  private pick(value: string): void {
    this.onSelect?.(value);
    this.popups.close();
  }

  private styleRow(style: TypographyStyle): ViewSpec {
    return h(
      'button',
      {
        class: 'typo-row',
        attrs: { type: 'button' },
        on: {
          click: () => {
            this.pick(style.value);
          },
        },
      },
      [
        h('span', {
          class: 'typo-row__icon',
          attrs: { 'aria-hidden': 'true' },
          props: { innerHTML: style.icon },
        }),
        h('span', { class: 'typo-row__body' }, [
          h('span', { class: 'typo-row__label' }, this.t(style.labelKey)),
          h('span', { class: `typo-row__sample ${style.sampleClass}` }, this.t(style.sampleKey)),
        ]),
      ]
    );
  }

  private section(titleKey: string, styles: TypographyStyle[]): ViewSpec {
    return h('section', { class: 'typo-section' }, [
      h('h3', { class: 'typo-section__title' }, this.t(titleKey)),
      h(
        'div',
        { class: 'typo-section__list' },
        styles.map((s) => this.styleRow(s))
      ),
    ]);
  }

  private stylesView(): ViewSpec {
    const headings = TYPOGRAPHY_STYLES.filter((s) => s.section === 'heading');
    const body = TYPOGRAPHY_STYLES.filter((s) => s.section === 'body');
    const insert = TYPOGRAPHY_STYLES.filter((s) => s.section === 'insert');

    return h('div', { class: 'typo-panel' }, [
      h(
        'button',
        {
          class: 'typo-clear',
          attrs: { type: 'button' },
          on: {
            click: () => {
              this.pick('clear');
            },
          },
        },
        [
          h('span', {
            class: 'typo-clear__icon',
            attrs: { 'aria-hidden': 'true' },
            props: { innerHTML: clearIcon },
          }),
          h('span', { class: 'typo-clear__text' }, [
            h('span', { class: 'typo-clear__label' }, this.t('typography.clearFormatting')),
            h('span', { class: 'typo-clear__hint' }, this.t('typography.clearHint')),
          ]),
        ]
      ),
      this.section('typography.sectionHeadings', headings),
      this.section('typography.sectionBody', body),
      this.section('typography.sectionInsert', insert),
    ]);
  }

  show(onSelect: (style: string) => void): void {
    this.onSelect = onSelect;
    this.popups.open({
      title: this.t('typography.styles'),
      className: 'typography-menu',
      size: 'md',
      closeOnClickOutside: true,
      items: [{ type: 'view', id: 'typography-styles', view: () => this.stylesView() }],
      buttons: [
        {
          label: this.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
      ],
    });
  }
}
