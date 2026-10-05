import { DisposableScope } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';
import { describe, expect, it } from 'vitest';

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
  it('mountStudio builds 50/50 panes with Type/Data/Settings tabs', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const scope = new DisposableScope();
    const menu = new ChartMenu(stubEditor(), scope);
    const studio = menu.mountStudio(host, { layout: 'workspace' });

    expect(host.querySelector('.ocm-studio')).toBeTruthy();
    expect(host.querySelector('.ocm-studio__tabs')).toBeTruthy();
    expect(host.querySelector('[data-ocm-studio-pane="editor"]')).toBeTruthy();
    expect(host.querySelector('[data-ocm-studio-pane="main"]')).toBeTruthy();
    expect(host.querySelector('.chart-ws-editor__title-host')).toBeTruthy();
    expect(host.querySelector('.chart-ws-editor__tabs')).toBeTruthy();
    expect(host.querySelectorAll('[data-chart-editor-tab]')).toHaveLength(3);
    expect(host.querySelector('[data-chart-editor-panel="settings"]')).toBeTruthy();
    expect(host.querySelector('.chart-ws-preview')).toBeTruthy();
    expect(host.querySelector('.export-btn')).toBeNull();
    expect(host.querySelector('.meta-fields')).toBeTruthy();
    expect(host.querySelector('.display-settings')).toBeTruthy();

    const body = host.querySelector('.ocm-studio__body');
    expect(body).toBeInstanceOf(HTMLElement);
    if (body instanceof HTMLElement) {
      expect(body.dataset.panel).toBe('main');
      expect(body.style.getPropertyValue('--ocm-studio-cols')).toBe('minmax(0,1fr) minmax(0,1fr)');
    }

    const editor = host.querySelector('.chart-ws-editor');
    expect(editor).toBeInstanceOf(HTMLElement);
    if (editor instanceof HTMLElement) {
      expect(editor.dataset.editorTab).toBe('type');
    }

    studio.destroy();
    scope.dispose();
    host.remove();
  });

  it('selecting a chart type switches editor tab to data', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const scope = new DisposableScope();
    const menu = new ChartMenu(stubEditor(), scope);
    const studio = menu.mountStudio(host, { layout: 'workspace' });

    const lineBtn = host.querySelector<HTMLElement>('.chart-type-option[data-type="line"]');
    expect(lineBtn).toBeTruthy();
    lineBtn?.click();

    const editor = host.querySelector('.chart-ws-editor');
    expect(editor).toBeInstanceOf(HTMLElement);
    if (editor instanceof HTMLElement) {
      expect(editor.dataset.editorTab).toBe('data');
    }
    const dataTab = host.querySelector('[data-chart-editor-tab="data"]');
    expect(dataTab?.classList.contains('is-active')).toBe(true);

    studio.destroy();
    scope.dispose();
    host.remove();
  });

  it('settings tab shows axis and display controls; title stays visible', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const scope = new DisposableScope();
    const menu = new ChartMenu(stubEditor(), scope);
    const studio = menu.mountStudio(host, { layout: 'workspace' });

    host.querySelector<HTMLElement>('[data-chart-editor-tab="settings"]')?.click();

    const editor = host.querySelector('.chart-ws-editor');
    expect(editor).toBeInstanceOf(HTMLElement);
    if (editor instanceof HTMLElement) {
      expect(editor.dataset.editorTab).toBe('settings');
    }
    expect(host.querySelector('.chart-ws-editor__title-host input')).toBeTruthy();
    expect(host.querySelector('.meta-fields')).toBeTruthy();
    expect(host.querySelector('.display-settings')).toBeTruthy();
    expect(
      host.querySelector('.chart-type-selector')?.closest('.chart-ws-editor__type')
    ).toBeTruthy();

    studio.destroy();
    scope.dispose();
    host.remove();
  });
});
