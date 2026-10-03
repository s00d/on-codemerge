import type { ViewSpec } from '@codemerge/sdk';
import { h } from '@codemerge/sdk';
import { getDriver } from '../drivers/registry';
import type { FormI18n } from '../drivers/types';
import type { FormConfig } from '../types';
import { fieldView } from './fieldView';

export type FormViewOpts = {
  preventSubmit?: boolean;
  /** Append default submit when no button/submit field present. */
  i18n?: FormI18n;
  /**
   * Studio-only: wrap each field for scroll/highlight (`data-ocm-field-id`).
   * Do not enable in publish/widget render.
   */
  studioAnchors?: boolean;
  /** Studio: field id to outline in preview. */
  highlightFieldId?: string | null;
};

function hasSubmitControl(config: FormConfig): boolean {
  return config.fields.some((f) => {
    const family = getDriver(f.type).family;
    return family === 'button' && (f.type === 'submit' || f.type === 'image');
  });
}

function studioFieldWrap(fieldId: string, highlighted: boolean, child: ViewSpec): ViewSpec {
  return h(
    'div',
    {
      class: `form-ws-field-anchor${highlighted ? ' is-highlighted' : ''}`,
      attrs: { 'data-ocm-field-id': fieldId },
    },
    child
  );
}

/** Form shell ViewSpec — fields via drivers; optional default submit. */
export function formView(config: FormConfig, opts: FormViewOpts = {}): ViewSpec {
  const { id, method, action, className, fields } = config;
  const i18n = opts.i18n ?? { t: (k: string) => k };
  const children: ViewSpec[] = fields.map((field) => {
    const view = fieldView(field);
    if (!opts.studioAnchors) {
      return view;
    }
    return studioFieldWrap(field.id, opts.highlightFieldId === field.id, view);
  });
  if (!hasSubmitControl(config)) {
    children.push(
      h(
        'button',
        { class: 'submit-button', attrs: { type: 'submit' } },
        i18n.t('formBuilder.submit') || 'Submit'
      )
    );
  }
  return h(
    'form',
    {
      class: `${className ?? 'generated-form'} not-prose`,
      attrs: { id, method, action },
      ...(opts.preventSubmit
        ? {
            on: {
              submit: (e: Event) => {
                e.preventDefault();
              },
            },
          }
        : {}),
    },
    children
  );
}
