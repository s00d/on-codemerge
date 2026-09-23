import { h, foreign, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import { colorWellView } from '../../../utils/ColorWell';
import { BORDER_STYLES, BORDER_WIDTHS, FONT_SIZES, FONT_WEIGHTS, TEXT_ALIGNS } from '../constants';
import type { StyleDraft } from '../constants';

export type ColorTarget = 'color' | 'background-color' | 'border-color';

function selectField(
  id: string,
  label: string,
  value: string,
  options: readonly string[],
  optionLabel: (v: string) => string,
  onChange: (v: string) => void
): ViewSpec {
  return h('label', { class: 'bs-field' }, [
    h('span', { class: 'bs-field__label' }, label),
    h(
      'select',
      {
        class: 'bs-field__select',
        attrs: { id },
        on: {
          change: (e: Event) => {
            onChange((e.target as HTMLSelectElement).value);
          },
        },
      },
      [
        h('option', { attrs: { value: '' } }, '—'),
        ...options.map((opt) =>
          h(
            'option',
            {
              attrs: {
                value: opt,
                ...(opt === value ? { selected: 'selected' } : {}),
              },
            },
            optionLabel(opt)
          )
        ),
      ]
    ),
  ]);
}

function previewStyle(draft: StyleDraft): Record<string, string> {
  const s: Record<string, string> = {
    color: draft.color || 'inherit',
    backgroundColor: draft['background-color'] || 'transparent',
    fontSize: draft['font-size'] || '16px',
    fontWeight: draft['font-weight'] || '400',
    textAlign: draft['text-align'] || 'left',
  };
  const bs = draft['border-style'] || 'none';
  if (bs !== 'none' && bs !== '') {
    s.borderStyle = bs;
    s.borderWidth = draft['border-width'] || '2px';
    s.borderColor = draft['border-color'] || '#0284c7';
  } else {
    s.border = '1px dashed var(--color-ocm-border, #e4e4e7)';
  }
  return s;
}

/**
 * Interactive block-style panel. Mutates `draft` in place.
 * Color picker is embedded (no nested popup — avoids closing the editor).
 */
export function blockStylePanel(editor: EditorAPI, draft: StyleDraft): ViewSpec {
  const t = (k: string) => editor.t(k);

  return foreign((host, scope) => {
    let colorTarget: ColorTarget = 'color';
    const wellSlot = scope.slot<MountHandle>();

    const weightLabel = (v: string) => {
      if (v === 'normal') {
        return t('blockStyle.weightNormal');
      }
      if (v === '700') {
        return t('blockStyle.weightBold');
      }
      return v;
    };
    const alignLabel = (v: string) => t(`blockStyle.align.${v}`) || v;
    const borderStyleLabel = (v: string) => t(`blockStyle.borderStyle.${v}`) || v;

    const applyPreview = (el: HTMLElement) => {
      Object.assign(el.style, previewStyle(draft));
    };

    const syncTabs = (root: HTMLElement) => {
      for (const btn of root.querySelectorAll<HTMLElement>('.bs-color-tab')) {
        const id = btn.dataset.target as ColorTarget | undefined;
        btn.classList.toggle('is-active', id === colorTarget);
      }
    };

    const mountWell = () => {
      const wellHost = host.querySelector<HTMLElement>('.bs-color-well');
      if (!wellHost) {
        return;
      }
      const wellInitial =
        colorTarget === 'color'
          ? draft.color || '#111111'
          : colorTarget === 'background-color'
            ? draft['background-color'] || '#ffffff'
            : draft['border-color'] || '#0284c7';

      wellSlot.replace(
        mount(
          wellHost,
          colorWellView(
            {
              initial: wellInitial,
              allowClear: true,
              onPick: (hex) => {
                draft[colorTarget] = hex;
                const preview = host.querySelector<HTMLElement>('.bs-preview');
                if (preview) {
                  applyPreview(preview);
                }
              },
              onClear: () => {
                draft[colorTarget] = '';
                const preview = host.querySelector<HTMLElement>('.bs-preview');
                if (preview) {
                  applyPreview(preview);
                }
              },
            },
            (k) => editor.t(k)
          )
        )
      );
    };

    const shell = h('div', { class: 'bs-panel' }, [
      h(
        'div',
        {
          class: 'bs-preview',
          style: previewStyle(draft),
          ref: 'preview',
        },
        [
          h('div', { class: 'bs-preview__title' }, t('blockStyle.previewTitle')),
          h('div', { class: 'bs-preview__sample' }, t('blockStyle.previewSample')),
        ]
      ),

      h('section', { class: 'bs-section' }, [
        h('h3', { class: 'bs-section__title' }, t('blockStyle.sectionText')),
        h('div', { class: 'bs-grid' }, [
          selectField(
            'bs-font-size',
            t('blockStyle.fontSize'),
            draft['font-size'],
            FONT_SIZES,
            (v) => v,
            (v) => {
              draft['font-size'] = v;
              const preview = host.querySelector<HTMLElement>('.bs-preview');
              if (preview) {
                applyPreview(preview);
              }
            }
          ),
          selectField(
            'bs-font-weight',
            t('blockStyle.fontWeight'),
            draft['font-weight'],
            FONT_WEIGHTS,
            weightLabel,
            (v) => {
              draft['font-weight'] = v;
              const preview = host.querySelector<HTMLElement>('.bs-preview');
              if (preview) {
                applyPreview(preview);
              }
            }
          ),
          selectField(
            'bs-text-align',
            t('blockStyle.textAlign'),
            draft['text-align'],
            TEXT_ALIGNS,
            alignLabel,
            (v) => {
              draft['text-align'] = v;
              const preview = host.querySelector<HTMLElement>('.bs-preview');
              if (preview) {
                applyPreview(preview);
              }
            }
          ),
        ]),
      ]),

      h('section', { class: 'bs-section' }, [
        h('h3', { class: 'bs-section__title' }, t('blockStyle.sectionBorder')),
        h('div', { class: 'bs-grid' }, [
          selectField(
            'bs-border-style',
            t('blockStyle.borderStyleLabel'),
            draft['border-style'],
            BORDER_STYLES,
            borderStyleLabel,
            (v) => {
              draft['border-style'] = v;
              if (v && v !== 'none' && !draft['border-width']) {
                draft['border-width'] = '2px';
              }
              const preview = host.querySelector<HTMLElement>('.bs-preview');
              if (preview) {
                applyPreview(preview);
              }
            }
          ),
          selectField(
            'bs-border-width',
            t('blockStyle.borderWidth'),
            draft['border-width'],
            BORDER_WIDTHS,
            (v) => v,
            (v) => {
              draft['border-width'] = v;
              const preview = host.querySelector<HTMLElement>('.bs-preview');
              if (preview) {
                applyPreview(preview);
              }
            }
          ),
        ]),
      ]),

      h('section', { class: 'bs-section' }, [
        h('h3', { class: 'bs-section__title' }, t('blockStyle.sectionColor')),
        h('div', { class: 'bs-color-tabs', ref: 'tabs' }, [
          h(
            'button',
            {
              class: 'bs-color-tab is-active',
              attrs: { type: 'button', 'data-target': 'color' },
              on: {
                click: () => {
                  colorTarget = 'color';
                  syncTabs(host);
                  mountWell();
                },
              },
            },
            t('blockStyle.textColor')
          ),
          h(
            'button',
            {
              class: 'bs-color-tab',
              attrs: { type: 'button', 'data-target': 'background-color' },
              on: {
                click: () => {
                  colorTarget = 'background-color';
                  syncTabs(host);
                  mountWell();
                },
              },
            },
            t('blockStyle.backgroundColor')
          ),
          h(
            'button',
            {
              class: 'bs-color-tab',
              attrs: { type: 'button', 'data-target': 'border-color' },
              on: {
                click: () => {
                  colorTarget = 'border-color';
                  syncTabs(host);
                  mountWell();
                },
              },
            },
            t('blockStyle.borderColor')
          ),
        ]),
        h('div', { class: 'bs-color-well' }),
      ]),
    ]);

    scope.own(mount(host, shell));
    mountWell();
  });
}
