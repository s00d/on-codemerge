import { h, foreign, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, TranslateParams, ViewSpec } from '@on-codemerge/sdk';
import { FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS } from '../constants';
import type { FontDraft, FontOption } from '../constants';
import { listAvailableFonts } from '../utils/detectFonts';

function chip(label: string, active: boolean, onClick: () => void): ViewSpec {
  return h(
    'button',
    {
      class: `fp-chip${active ? ' is-active' : ''}`,
      attrs: { type: 'button' },
      on: { click: onClick },
    },
    label
  );
}

function familyOptions(families: FontOption[], draftFamily: string): FontOption[] {
  const opts = [...families];
  if (draftFamily && !opts.some((f) => f.id === draftFamily)) {
    opts.unshift({
      id: draftFamily,
      label: draftFamily.split(',')[0]?.replaceAll(/['"]/g, '').trim() || draftFamily,
    });
  }
  return opts;
}

/**
 * Font settings panel — live preview + chips. Mutates `draft` in place.
 * Font list comes from local detection (canvas probe / Local Font Access if granted).
 */
export function fontSettingsPanel(editor: EditorAPI, draft: FontDraft): ViewSpec {
  const t = (k: string, params?: TranslateParams) => editor.t(k, params);

  return foreign((host, scope) => {
    // Static fallback first so the modal is never blank while probing.
    let families: FontOption[] = [...FONT_FAMILIES];
    let handle: MountHandle | null = null;
    scope.disposable(() => {
      handle?.destroy();
      handle = null;
    });

    const paint = () => {
      const opts = familyOptions(families, draft.family);
      const familyLabel =
        opts.find((f) => f.id === draft.family)?.label ??
        draft.family.split(',')[0]?.replaceAll(/['"]/g, '').trim() ??
        '';

      const previewStyle: Record<string, string> = {
        fontFamily: draft.family || 'inherit',
        fontSize: draft.size || '16px',
        lineHeight: draft.lineHeight === 'normal' || !draft.lineHeight ? '1.5' : draft.lineHeight,
      };

      const installed = Math.max(0, families.length - 1);

      const spec = h('div', { class: 'fp-panel' }, [
        h('div', { class: 'fp-preview', style: previewStyle }, [
          h('div', { class: 'fp-preview__meta' }, [
            familyLabel,
            ' · ',
            draft.size || '16px',
            ' · ',
            draft.lineHeight || '1.5',
          ]),
          h('div', { class: 'fp-preview__sample' }, t('font.previewSample')),
        ]),

        h('section', { class: 'fp-section' }, [
          h('h3', { class: 'fp-section__title' }, [
            t('font.family'),
            h(
              'span',
              { class: 'fp-section__hint' },
              ` · ${t('font.availableCount', { n: installed })}`
            ),
          ]),
          h(
            'select',
            {
              class: 'fp-select',
              attrs: { 'aria-label': t('font.family') },
              on: {
                change: (e: Event) => {
                  draft.family = (e.target as HTMLSelectElement).value;
                  paint();
                },
              },
            },
            opts.map((f) =>
              h(
                'option',
                {
                  attrs: {
                    value: f.id,
                    ...(f.id === draft.family ? { selected: 'selected' } : {}),
                  },
                  style: { fontFamily: f.id },
                },
                f.label
              )
            )
          ),
        ]),

        h('section', { class: 'fp-section' }, [
          h('h3', { class: 'fp-section__title' }, t('font.size')),
          h('div', { class: 'fp-chips' }, [
            ...(draft.size && !(FONT_SIZES as readonly string[]).includes(draft.size)
              ? [
                  chip(draft.size.replace('px', ''), true, () => {
                    paint();
                  }),
                ]
              : []),
            ...FONT_SIZES.map((sz) =>
              chip(sz.replace('px', ''), draft.size === sz, () => {
                draft.size = sz;
                paint();
              })
            ),
          ]),
        ]),

        h('section', { class: 'fp-section' }, [
          h('h3', { class: 'fp-section__title' }, t('font.lineHeight')),
          h(
            'div',
            { class: 'fp-chips' },
            LINE_HEIGHTS.map((lh) =>
              chip(t(lh.labelKey), draft.lineHeight === lh.id, () => {
                draft.lineHeight = lh.id;
                paint();
              })
            )
          ),
        ]),
      ]);

      // update() remounts in place — never destroy-after-remount (wipes the new DOM).
      if (handle) {
        handle.update(spec);
      } else {
        handle = mount(host, spec);
      }
    };

    paint();

    void listAvailableFonts()
      .then((list) => {
        if (list.length > 0) {
          families = list;
          paint();
        }
      })
      .catch(() => {
        /* keep static FONT_FAMILIES */
      });
  });
}
