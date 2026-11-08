import { describe, expect, it } from 'vitest';
import { viewToHtml } from '@codemerge/sdk';
import { createField, getDriver } from '../drivers/registry';
import { formView } from '../render/formView';
import { emptyFormConfig } from '../io/adapters';

const stubI18n = { t: (k: string) => k };

describe('published form HTML', () => {
  it('keeps select / textarea defaults in serialized HTML', () => {
    const select = createField('select', stubI18n, 's1');
    select.options = { ...select.options, value: 'Option 2' };
    expect(viewToHtml(getDriver('select').render(select))).toMatch(/value="Option 2" selected/);

    const ta = createField('textarea', stubI18n, 't1');
    ta.options = { ...ta.options, value: 'hello' };
    expect(viewToHtml(getDriver('textarea').render(ta))).toContain('>hello</textarea>');
  });

  it('drops script-scheme form actions', () => {
    const config = { ...emptyFormConfig(), action: ' JavaScript:alert(1)' };
    expect(viewToHtml(formView(config))).not.toMatch(/javascript/i);
    const ok = { ...emptyFormConfig(), action: '/submit' };
    expect(viewToHtml(formView(ok))).toContain('action="/submit"');
  });
});
