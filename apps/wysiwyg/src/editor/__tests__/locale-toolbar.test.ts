import { describe, expect, it } from 'vitest';
import { Editor } from '../Editor';
import { createDefaultPlugins } from '../../plugins';

describe('locale toolbar live', () => {
  it('updates mark titles on setLocale', async () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      plugins: createDefaultPlugins(),
    });
    await editor.whenLocaleReady();
    // mimic LanguagePlugin restore
    await editor.setLocale('de');
    expect(editor.getLocale()).toBe('de');
    expect(editor.t('toolbar.bold')).toBe('Fett');
    expect(editor.t('common.language')).toBe('Sprache');
    expect(editor.t('history.undo')).toBe('Rückgängig');
    editor.toolbar.refresh();
    const bold = host.querySelector('[data-id="bold"]')?.getAttribute('title');
    const undo = host.querySelector('[data-id="undo"]')?.getAttribute('title');
    const tools = host.querySelector('[data-id="menu-tools"]')?.getAttribute('title');
    expect(tools).toBe('Werkzeuge');
    expect(bold).toBe('Fett');
    expect(undo).toBe('Rückgängig');
    editor.destroy();
    host.remove();
  });
});
