import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { SpellCheckerPlugin } from '../index';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '../../../packages/hunspell/src/__tests__/fixtures');
const files: Record<string, string> = {
  'mini.aff': readFileSync(resolve(fixtures, 'mini.aff'), 'utf8'),
  'mini.dic': readFileSync(resolve(fixtures, 'mini.dic'), 'utf8'),
};

describe('SpellCheckerPlugin marks vs undo history', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('paints misspelled marks without recording undo entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => Promise.resolve(new Response(files[url] ?? '', { status: 200 })))
    );
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      plugins: [SpellCheckerPlugin({ dictionaries: { en: { aff: 'mini.aff', dic: 'mini.dic' } } })],
    });
    editor.setHTML('<p>catt</p>');
    expect(editor.undo()).toBe(false);

    editor.command('toggleSpellCheck');
    await vi.waitFor(() => {
      expect(JSON.stringify(editor.getJSON().doc)).toContain('misspelled');
    });
    expect(editor.undo()).toBe(false);

    editor.command('toggleSpellCheck');
    expect(JSON.stringify(editor.getJSON().doc)).not.toContain('misspelled');
    expect(editor.undo()).toBe(false);

    editor.destroy();
    host.remove();
  });
});
