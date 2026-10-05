import { describe, expect, it, afterEach } from 'vitest';
import { Editor } from '../Editor';
import { createDefaultPlugins, insertProperty, renameKey } from '@ocm/json-plugin';
import { ParseError } from '@codemerge/kernel';

describe('json Editor entry', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts) {
      const ed = Reflect.get(host, '__editor');
      if (ed && typeof ed.destroy === 'function') {
        ed.destroy();
      }
      host.remove();
    }
    hosts.length = 0;
  });

  function mountEditor(): Editor {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new Editor(host, {
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);
    return editor;
  }

  it('defaults shell createView; contentTarget is stable .ocm-content', () => {
    const editor = mountEditor();
    const root = editor.host.querySelector('.ocm-content');
    expect(root).toBeTruthy();
    expect(editor.view.contentTarget()).toBe(root);
    expect((root as HTMLElement).getAttribute('contenteditable')).not.toBe('true');
    // CM raw pane uses contenteditable; shell host itself must not.
    expect(root.querySelector('.ocm-json-tree')).toBeTruthy();
    expect(hostHasJsonTree(editor.host)).toBe(true);
  });

  it('getText / setText + invalid leaves SoT unchanged', () => {
    const editor = mountEditor();
    expect(editor.setText('{"x":1}')).toBeNull();
    expect(JSON.parse(editor.getText())).toStrictEqual({ x: 1 });
    const before = editor.getJSON();
    const err = editor.setText('{');
    expect(err).toBeInstanceOf(ParseError);
    expect(editor.getJSON()).toStrictEqual(before);
  });

  it('structural edit via run(insertProperty)', () => {
    const editor = mountEditor();
    editor.setText('{"a":1}');
    const ok = editor.run(insertProperty([0, 0], 'b', 2));
    expect(ok).toBe(true);
    expect(JSON.parse(editor.getText())).toStrictEqual({ a: 1, b: 2 });
    expect(editor.run(insertProperty([0, 0], 'a', 9))).toBe(false);
  });

  it('named commands are registered', () => {
    const editor = mountEditor();
    editor.setText('{}');
    editor.setSelection({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    });
    expect(editor.command('insertProperty')).toBe(true);
    expect(JSON.parse(editor.getText())).toStrictEqual({ property: null });
    expect(editor.command('insertProperty')).toBe(false);
  });

  it('dirty Raw is fail-closed: Discard restores SoT text without wipe-on-tree', () => {
    const editor = mountEditor();
    expect(editor.setText('{"a":1}')).toBeNull();
    (editor.host.querySelector('[data-id="json-mode-raw"]') as HTMLButtonElement).click();
    expect(editor.contentElement()?.getAttribute('data-ocm-json-mode')).toBe('raw');
    const discard = [...editor.contentElement()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Discard'
    ) as HTMLButtonElement;
    expect(discard).toBeTruthy();
    discard.click();
    expect(editor.host.textContent).toContain('SoT synced');
    expect(editor.getText()).toContain('"a"');
    expect(editor.contentElement()?.getAttribute('data-ocm-json-mode')).toBe('raw');
  });

  it('renameKey same key is no-op', () => {
    const editor = mountEditor();
    editor.setText('{"a":1}');
    expect(editor.run(renameKey([0, 0, 0], 'a'))).toBe(false);
  });
});

function hostHasJsonTree(host: HTMLElement): boolean {
  return host.querySelector('.ocm-json-tree') !== null;
}
