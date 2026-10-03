import { describe, expect, it } from 'vitest';
import { DisposableScope } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';
import { emptyFormConfig } from '../io/adapters';
import { mountFormWorkspace } from '../surface/workspaceView';

function stubEditor(): EditorAPI {
  return {
    t: (k: string) => k,
  } as unknown as EditorAPI;
}

describe('form studio layout', () => {
  it('mounts ocm-studio with three panes and mobile tabs', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const scope = new DisposableScope();
    const handle = mountFormWorkspace(stubEditor(), host, {
      mode: 'atom',
      initial: emptyFormConfig(),
      scope,
    });

    expect(host.querySelector('.ocm-studio')).toBeTruthy();
    expect(host.querySelector('.ocm-studio__tabs')).toBeTruthy();
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(host.querySelector('[data-ocm-studio-pane="palette"]')).toBeTruthy();
    expect(host.querySelector('[data-ocm-studio-pane="canvas"]')).toBeTruthy();
    expect(host.querySelector('[data-ocm-studio-pane="inspector"]')).toBeTruthy();

    const body = host.querySelector('.ocm-studio__body');
    expect(body).toBeInstanceOf(HTMLElement);
    if (body instanceof HTMLElement) {
      expect(body.style.getPropertyValue('--ocm-studio-cols')).toContain('14rem');
    }

    handle.destroy();
    scope.dispose();
    host.remove();
  });
});
