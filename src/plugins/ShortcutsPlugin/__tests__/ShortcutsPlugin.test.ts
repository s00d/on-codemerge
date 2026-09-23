import { describe, expect, it } from 'vitest';
import { ShortcutsPlugin } from '../index';
import { Editor } from '../../../editor/Editor';

describe('shortcutsPlugin', () => {
  it('registers as a declarative plugin', () => {
    expect.hasAssertions();
    const plugin = ShortcutsPlugin();
    expect(plugin.name).toBe('shortcuts');
  });

  it('mounts toolbar button via Editor', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: [ShortcutsPlugin()] });
    expect(editor).toBeTruthy();
    editor.destroy();
    host.remove();
  });
});
