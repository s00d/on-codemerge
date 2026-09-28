import { describe, expect, it, afterEach } from 'vitest';
import { Editor, createShellView } from '../index';

describe('Editor.contentElement', () => {
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

  it('returns shell content host with data-ocm-shell', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new Editor(host, {
      createView: createShellView,
      plugins: [],
    });
    Reflect.set(host, '__editor', editor);

    const el = editor.contentElement();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el?.getAttribute('data-ocm-shell')).toBe('true');
    expect(el?.classList.contains('ocm-content')).toBe(true);
  });
});
