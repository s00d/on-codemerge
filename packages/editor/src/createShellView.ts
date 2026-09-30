import type { CreateView, ViewPort } from './ViewPort';
import { h, renderDetached } from '@codemerge/sdk';

/**
 * Empty stable content host for plugin-owned surfaces (e.g. JsonPlugin workspace).
 * `contentTarget()` is this node; plugins mount UI into it during `setup`.
 */
export const createShellView: CreateView = (editor): ViewPort => {
  const { el: content } = renderDetached(
    h('div', {
      class: 'ocm-content ocm-shell-content flex-1 min-h-0 overflow-auto',
      attrs: { 'data-ocm-shell': 'true' },
    })
  );
  editor.host.append(content);

  return {
    update() {
      /* plugin owns projection */
    },
    updateSelection() {
      /* no-op */
    },
    destroy() {
      content.remove();
    },
    contentTarget() {
      return content;
    },
    contentElement() {
      return content;
    },
  };
};
