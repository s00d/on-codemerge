import { describe, expect, it } from 'vitest';
import { h, mount, renderDetached } from '../view';
import { studioPaneTabs, syncStudioPanel } from '../studioLayout';

describe('studioLayout', () => {
  it('studioPaneTabs marks active tab', () => {
    expect.hasAssertions();
    let selected = '';
    const { el } = renderDetached(
      studioPaneTabs(
        [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
        'b',
        (id) => {
          selected = id;
        }
      )
    );
    const tabs = el.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]?.classList.contains('is-active')).toBe(true);
    (tabs[0] as HTMLButtonElement).click();
    expect(selected).toBe('a');
  });

  it('syncStudioPanel toggles is-studio-hidden on direct panes', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    mount(
      host,
      h(
        'div',
        { class: 'ocm-studio__body' },
        h('div', { attrs: { 'data-ocm-studio-pane': 'palette' } }),
        h('div', { attrs: { 'data-ocm-studio-pane': 'canvas' } }),
        h('div', { attrs: { 'data-ocm-studio-pane': 'inspector' } })
      )
    );
    const body = host.firstElementChild;
    expect(body).toBeInstanceOf(HTMLElement);
    if (!(body instanceof HTMLElement)) {
      return;
    }
    syncStudioPanel(body, 'canvas');
    expect(body.dataset.panel).toBe('canvas');
    const panes = [...body.querySelectorAll(':scope > [data-ocm-studio-pane]')];
    expect(panes.map((p) => (p as HTMLElement).dataset.ocmStudioPane)).toStrictEqual([
      'palette',
      'canvas',
      'inspector',
    ]);
    expect(panes[0]?.classList.contains('is-studio-hidden')).toBe(true);
    expect(panes[1]?.classList.contains('is-studio-hidden')).toBe(false);
    expect(panes[2]?.classList.contains('is-studio-hidden')).toBe(true);

    syncStudioPanel(body, 'inspector');
    expect(panes[0]?.classList.contains('is-studio-hidden')).toBe(true);
    expect(panes[1]?.classList.contains('is-studio-hidden')).toBe(true);
    expect(panes[2]?.classList.contains('is-studio-hidden')).toBe(false);
  });
});
