/**
 * Prose plugin acceptance in JSON Editor (shell + JsonPlugin workspace).
 */
import { describe, expect, it, afterEach } from 'vitest';
import { definePlugin } from '@on-codemerge/sdk';
import { Editor, JsonPlugin } from 'on-codemerge/json';
import { TablePlugin } from 'on-codemerge/app';

describe('prose plugin smoke (on-codemerge/json)', () => {
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

  it('registers TablePlugin + JsonPlugin; chrome + onDom(contentTarget)', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const contentTargets: EventTarget[] = [];
    let notified = false;
    let docChanged = 0;

    const ProbePlugin = () =>
      definePlugin({
        name: 'json-prose-smoke-probe',
        setup(ctx) {
          ctx.onDom('content', 'mousedown', (ev) => {
            if (ev.currentTarget) {
              contentTargets.push(ev.currentTarget);
            }
          });
          ctx.toolbar.add({
            id: 'smoke-probe',
            label: () => 'Probe',
            title: () => 'Probe',
            onClick: () => {
              /* toolbar usable */
            },
          });
          ctx.editor.notify('smoke-ok');
          notified = true;
          ctx.on('docChanged', () => {
            docChanged += 1;
          });
        },
      });

    let editor: Editor;
    expect(() => {
      editor = new Editor(host, {
        chrome: 'bar',
        plugins: [JsonPlugin({ surface: 'workspace' }), TablePlugin(), ProbePlugin()],
      });
    }).not.toThrow();
    Reflect.set(host, '__editor', editor!);

    expect(notified).toBe(true);
    const contentRoot = host.querySelector('.ocm-content');
    expect(contentRoot).toBeTruthy();
    // Shell host is not CE; CM raw pane may use contenteditable.
    expect((contentRoot as HTMLElement).getAttribute('contenteditable')).not.toBe('true');
    expect(host.querySelector('.cm-editor')).toBeTruthy();
    expect(editor!.view.contentTarget()).toBe(contentRoot);
    expect(host.querySelector('[data-id="smoke-probe"]')).toBeTruthy();
    expect(editor!.listPlugins().some((p) => p.name === 'table')).toBe(true);
    expect(editor!.listPlugins().some((p) => p.name === 'json')).toBe(true);

    const tree = host.querySelector('.ocm-json-tree');
    expect(tree).toBeTruthy();
    tree!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(contentTargets.length).toBe(1);
    expect(contentTargets[0]).toBe(contentRoot);
    expect(contentTargets[0]).not.toBe(host);

    const before = docChanged;
    expect(editor!.setText('{"ok":true}')).toBeNull();
    expect(docChanged).toBeGreaterThan(before);

    const liveTree = host.querySelector('.ocm-json-tree');
    expect(liveTree).toBeTruthy();
    expect(editor!.view.contentTarget()).toBe(contentRoot);
    liveTree!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(contentTargets.length).toBe(2);
    expect(contentTargets[1]).toBe(contentRoot);

    expect(editor!.command('insertTable')).toBe(false);
    const types = editor!.getState().doc.content?.map((n) => n.type) ?? [];
    expect(types).toStrictEqual(['json']);

    const lateTargets: EventTarget[] = [];
    expect(() => {
      editor!.use(
        definePlugin({
          name: 'json-prose-smoke-late',
          setup(ctx) {
            ctx.editor.notify('late');
            ctx.onDom('content', 'mousedown', (ev) => {
              if (ev.currentTarget) {
                lateTargets.push(ev.currentTarget);
              }
            });
          },
        })
      );
    }).not.toThrow();
    liveTree!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(lateTargets.length).toBeGreaterThan(0);
    expect(lateTargets[0]).toBe(contentRoot);
    expect(lateTargets[0]).not.toBe(host);
  });
});
