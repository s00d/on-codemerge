import type { ViewSpec } from './view';

/** Built-in targets — Vue Teleport–style named outlets. */
export type PortalTargetName = 'body' | 'menu' | 'popup' | 'notify' | (string & {});

export type PortalTo = PortalTargetName | HTMLElement;

export interface PortalOptions {
  /** Where to teleport. Default `'body'`. */
  to?: PortalTo;
  /** Class on the portal host wrapper. */
  className?: string;
  /** Extra attrs on the host. */
  attrs?: Record<string, string>;
}

const ROOT_ATTR = 'data-ocm-portal';
const roots = new Map<string, HTMLElement>();

function ensureDocumentBody(): HTMLElement {
  if (typeof document === 'undefined') {
    throw new TypeError('getPortalRoot: document.body is not available');
  }
  // document.body is typed as HTMLElement in DOM libs; still guard at runtime.
  const body: HTMLElement | null = document.body;
  if (body === null) {
    throw new Error('getPortalRoot: document.body is not available');
  }
  return body;
}

/**
 * Resolve / create a named portal root under `document.body`.
 * Custom `HTMLElement` targets are returned as-is.
 */
export function getPortalRoot(to: PortalTo = 'body'): HTMLElement {
  if (typeof to !== 'string') {
    return to;
  }

  const existing = roots.get(to);
  if (existing?.isConnected) {
    return existing;
  }

  const body = ensureDocumentBody();
  const safe = to.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`);
  const found = body.querySelector<HTMLElement>(`[${ROOT_ATTR}="${safe}"]`);
  if (found) {
    roots.set(to, found);
    return found;
  }

  const el = document.createElement('div');
  el.setAttribute(ROOT_ATTR, to);
  el.className = `ocm-portal ocm-portal--${to}`;
  body.append(el);
  roots.set(to, el);
  return el;
}

/** Register / override a named portal target (e.g. shadow-root host). */
export function setPortalRoot(name: PortalTargetName, el: HTMLElement): void {
  roots.set(name, el);
  if (!el.hasAttribute(ROOT_ATTR)) {
    el.setAttribute(ROOT_ATTR, name);
  }
  if (!el.classList.contains('ocm-portal')) {
    el.classList.add('ocm-portal', `ocm-portal--${name}`);
  }
}

/** Drop cached root (tests / editor destroy). Does not remove DOM unless `remove`. */
export function clearPortalRoot(name?: PortalTargetName, remove = false): void {
  if (name === undefined) {
    if (remove) {
      for (const el of roots.values()) {
        el.remove();
      }
    }
    roots.clear();
    return;
  }
  const el = roots.get(name);
  if (remove) {
    el?.remove();
  }
  roots.delete(name);
}

/** Declarative Teleport node for ViewSpec trees. */
export type ViewTeleportSpec = {
  teleport: true;
  to?: PortalTo;
  className?: string;
  children?: ViewSpec | ViewSpec[];
  key?: string;
};

export function isTeleport(spec: unknown): spec is ViewTeleportSpec {
  return typeof spec === 'object' && spec !== null && (spec as ViewTeleportSpec).teleport;
}

/**
 * Hyperscript-style Teleport — like Vue `<Teleport to="body">`.
 *
 * @example
 * ```ts
 * teleport('popup', h('div', { class: 'modal' }, 'Hi'))
 * teleport({ to: 'body', className: 'x' }, childA, childB)
 * ```
 */
export function teleport(
  toOrOpts: PortalTo | PortalOptions,
  ...children: ViewSpec[]
): ViewTeleportSpec {
  if (
    typeof toOrOpts === 'object' &&
    toOrOpts !== null &&
    !(toOrOpts instanceof HTMLElement) &&
    ('to' in toOrOpts || 'className' in toOrOpts || 'attrs' in toOrOpts)
  ) {
    const opts = toOrOpts;
    return {
      teleport: true,
      to: opts.to ?? 'body',
      className: opts.className,
      children: children.length === 1 ? children[0] : children,
    };
  }
  return {
    teleport: true,
    to: toOrOpts as PortalTo,
    children: children.length === 1 ? children[0] : children,
  };
}
