import { describe, expect, it } from 'vitest';
import { DisposableScope } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';
import { ChartMenu } from '../components/ChartMenu';

function stubEditor(): EditorAPI {
  return {
    t: (k: string) => k,
    ui: {
      popup: {
        open: () => ({ close: () => {}, update: () => {} }),
      },
    },
  } as unknown as EditorAPI;
}

describe('chart studio layout', () => {
  it('mountStudio builds ocm-studio with options/main panes', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const scope = new DisposableScope();
    const menu = new ChartMenu(stubEditor(), scope);
    const studio = menu.mountStudio(host, { layout: 'workspace' });

    expect(host.querySelector('.ocm-studio')).toBeTruthy();
    expect(host.querySelector('.ocm-studio__tabs')).toBeTruthy();
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(host.querySelector('[data-ocm-studio-pane="options"]')).toBeTruthy();
    expect(host.querySelector('[data-ocm-studio-pane="main"]')).toBeTruthy();

    const body = host.querySelector('.ocm-studio__body');
    expect(body).toBeInstanceOf(HTMLElement);
    if (body instanceof HTMLElement) {
      expect(body.dataset.panel).toBe('main');
      expect(body.style.getPropertyValue('--ocm-studio-cols')).toContain('minmax(16rem');
    }

    studio.destroy();
    scope.dispose();
    host.remove();
  });
});
