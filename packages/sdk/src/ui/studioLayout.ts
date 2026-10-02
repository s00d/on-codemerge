import { h } from './view';
import type { ViewSpec } from './view';

/** Class for wide atom/workspace studio popups (full-bleed on narrow viewports). */
export const STUDIO_POPUP_CLASS = 'ocm-studio-popup';

export type StudioPaneTab = {
  id: string;
  label: string;
};

/**
 * Mobile tab strip for multi-pane studios (hidden from `lg` up via CSS).
 * Pair with `.ocm-studio__body` + `syncStudioPanel`.
 */
export function studioPaneTabs(
  panes: StudioPaneTab[],
  active: string,
  onSelect: (id: string) => void
): ViewSpec {
  return h(
    'div',
    { class: 'ocm-studio__tabs', attrs: { role: 'tablist' } },
    ...panes.map((pane) =>
      h(
        'button',
        {
          class: `ocm-studio__tab${active === pane.id ? ' is-active' : ''}`,
          attrs: {
            type: 'button',
            role: 'tab',
            'aria-selected': active === pane.id ? 'true' : 'false',
          },
          on: {
            click: () => {
              onSelect(pane.id);
            },
          },
        },
        pane.label
      )
    )
  );
}

/**
 * Set `data-panel` and toggle `.is-studio-hidden` on direct pane children.
 * CSS only hides `.is-studio-hidden` below 64rem — desktop always shows all panes.
 */
export function syncStudioPanel(body: HTMLElement, active: string): void {
  body.dataset.panel = active;
  for (const el of body.querySelectorAll(':scope > [data-ocm-studio-pane]')) {
    if (el instanceof HTMLElement) {
      el.classList.toggle('is-studio-hidden', el.dataset.ocmStudioPane !== active);
    }
  }
}
