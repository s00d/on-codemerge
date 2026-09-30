import { h, mount, renderDetached } from '@codemerge/sdk';
import type { PresencePeer } from './protocol.ts';

/** Lightweight avatar stack under content root. */
export function renderPresenceOverlay(host: HTMLElement, peers: PresencePeer[]): () => void {
  let target = host.querySelector(':scope > .ocm-collab-presence');
  if (!(target instanceof HTMLElement)) {
    const { el } = renderDetached(
      h('div', {
        class: 'ocm-collab-presence pointer-events-none absolute right-2 top-2 z-20 flex gap-1',
      })
    );
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }
    host.appendChild(el);
    target = el;
  }

  const avatars = peers.slice(0, 8).map((p) => {
    const color = p.color ?? '#2563eb';
    const label = (p.name ?? p.userId).slice(0, 2).toUpperCase();
    return h(
      'div',
      {
        class:
          'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow',
        style: { background: color },
        attrs: { title: p.name ?? p.userId },
      },
      label
    );
  });

  mount(target as HTMLElement, h('div', { class: 'flex' }, avatars));

  return () => {
    target.remove();
  };
}
