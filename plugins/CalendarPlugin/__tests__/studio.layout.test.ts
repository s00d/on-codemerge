import { describe, expect, it } from 'vitest';
import { DisposableScope } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';
import { emptyCalendarDoc } from '../drivers/defaults';
import { mountCalendarWorkspace } from '../surface/workspaceView';

function stubEditor(): EditorAPI {
  return {
    t: (k: string) => k,
  } as unknown as EditorAPI;
}

describe('calendar studio layout', () => {
  it('mounts ocm-studio with three panes and mobile tabs', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const scope = new DisposableScope();
    const handle = mountCalendarWorkspace(stubEditor(), host, {
      mode: 'atom',
      initial: emptyCalendarDoc({
        title: 'Team',
        cursor: '2026-10-02',
        calendars: [{ id: 'main', title: 'Work', color: '#3b82f6', visible: true }],
      }),
      scope,
    });

    expect(host.querySelector('.ocm-studio')).toBeTruthy();
    expect(host.querySelector('.ocm-studio__tabs-host')).toBeTruthy();
    expect(host.querySelector('.ocm-studio__tabs')).toBeTruthy();
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(host.querySelector('[data-ocm-studio-pane="palette"]')).toBeTruthy();
    expect(host.querySelector('[data-ocm-studio-pane="canvas"]')).toBeTruthy();
    expect(host.querySelector('[data-ocm-studio-pane="inspector"]')).toBeTruthy();

    const body = host.querySelector('.ocm-studio__body');
    expect(body).toBeInstanceOf(HTMLElement);
    if (body instanceof HTMLElement) {
      expect(body.dataset.panel).toBe('canvas');
      expect(
        body
          .querySelector('[data-ocm-studio-pane="canvas"]')
          ?.classList.contains('is-studio-hidden')
      ).toBe(false);
      expect(
        body
          .querySelector('[data-ocm-studio-pane="palette"]')
          ?.classList.contains('is-studio-hidden')
      ).toBe(true);
    }

    const paletteTab = [...host.querySelectorAll('[role="tab"]')].find((t) =>
      t.textContent?.includes('calendar.calendars')
    );
    expect(paletteTab).toBeTruthy();
    (paletteTab as HTMLButtonElement).click();
    if (body instanceof HTMLElement) {
      expect(body.dataset.panel).toBe('palette');
      expect(
        body
          .querySelector('[data-ocm-studio-pane="palette"]')
          ?.classList.contains('is-studio-hidden')
      ).toBe(false);
    }

    handle.destroy();
    scope.dispose();
    host.remove();
  });
});
