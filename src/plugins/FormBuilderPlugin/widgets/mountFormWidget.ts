import type { EditorAPI, DisposableScope } from '@on-codemerge/sdk';
import { attrString, mount, h } from '@on-codemerge/sdk';
import { FormManager } from '../services/FormManager';
import type { FormConfig } from '../types';
import { atomAlignStyle } from '../../../utils/atomAlign';

/** Mount form atom; teardown via `scope`. */
export function mountFormWidget(
  el: HTMLElement,
  attrs: Record<string, unknown>,
  getApi: () => EditorAPI | null,
  scope: DisposableScope
): void {
  el.className = 'ocm-form-atom';
  // Sized host so toolbar align (margin auto) works like timer/calendar.
  el.style.maxWidth = '28rem';
  el.style.marginLeft = '';
  el.style.marginRight = '';
  el.style.display = '';
  Object.assign(el.style, atomAlignStyle(attrString(attrs.align, '')));
  const api = getApi();
  if (!api) {
    scope.own(mount(el, h('div', null, '[form]')));
    return;
  }
  const formManager = new FormManager(api);
  let config: FormConfig | null = null;
  try {
    const raw = attrs.schema;
    config = JSON.parse(typeof raw === 'string' ? raw : '{}') as FormConfig;
  } catch {
    config = null;
  }
  const spec =
    config && Array.isArray(config.fields)
      ? formManager.createForm(config)
      : formManager.createForm({
          id: 'form',
          action: attrString(attrs.action),
          method: 'POST',
          fields: [],
        });
  scope.own(mount(el, spec));
  const formEl = el.querySelector('form');
  if (formEl) {
    scope.on(formEl, 'submit', (e) => {
      e.preventDefault();
    });
  }
}
