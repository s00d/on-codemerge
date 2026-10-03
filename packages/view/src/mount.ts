import { DisposableScope } from './disposable';
import { getPortalRoot, isTeleport } from './portal';
import type { PortalOptions } from './types';
import type {
  MountHandle,
  PortalHandle,
  ViewElementSpec,
  ViewEventMap,
  ViewForeignSpec,
  ViewSpec,
} from './types';

function className(value: string | string[] | undefined): string {
  if (value === undefined || value === '') {
    return '';
  }
  return Array.isArray(value) ? value.filter((c) => c !== '').join(' ') : value;
}

function flatten(children: ViewSpec | ViewSpec[] | undefined): ViewSpec[] {
  if (children === undefined || children === null || children === false) {
    return [];
  }
  if (Array.isArray(children)) {
    const out: ViewSpec[] = [];
    for (const c of children) {
      out.push(...flatten(c));
    }
    return out;
  }
  return [children];
}

function isForeign(spec: ViewSpec): spec is ViewForeignSpec {
  return typeof spec === 'object' && spec !== null && !Array.isArray(spec) && 'foreign' in spec;
}

function isElement(spec: ViewSpec): spec is ViewElementSpec {
  return typeof spec === 'object' && spec !== null && !Array.isArray(spec) && 'tag' in spec;
}

function applyAttrs(el: HTMLElement, attrs: ViewElementSpec['attrs']): void {
  if (!attrs) {
    return;
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) {
      el.removeAttribute(k);
    } else if (v === true) {
      el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
}

function applyStyle(el: HTMLElement, style: ViewElementSpec['style']): void {
  if (!style) {
    return;
  }
  for (const [k, v] of Object.entries(style)) {
    const value = String(v);
    // CSS variables must use setProperty — assignment via index can be dropped.
    if (k.startsWith('--')) {
      el.style.setProperty(k, value);
    } else {
      Reflect.set(el.style, k, value);
    }
  }
}

function applyProps(el: HTMLElement, props: ViewElementSpec['props']): void {
  if (!props) {
    return;
  }
  for (const [k, v] of Object.entries(props)) {
    Reflect.set(el, k, v);
  }
}

function bindEvents(el: HTMLElement, on: ViewEventMap | undefined, scope: DisposableScope): void {
  if (on === undefined) {
    return;
  }
  for (const type in on) {
    if (!Object.hasOwn(on, type)) {
      continue;
    }
    if (!isElementEventType(type)) {
      continue;
    }
    const handler = on[type];
    if (handler === undefined) {
      continue;
    }
    bindDomEvent(el, type, handler, scope);
  }
}

function bindDomEvent<K extends keyof ViewEventMap>(
  el: HTMLElement,
  type: K,
  handler: NonNullable<ViewEventMap[K]>,
  scope: DisposableScope
): void {
  scope.on(el, type, handler);
}

let elementEventProbe: HTMLElement | undefined;

function isElementEventType(type: string): type is keyof ViewEventMap {
  if (typeof document === 'undefined') {
    return true;
  }
  elementEventProbe ??= document.createElement('div');
  const prop = `on${type}`;
  return prop in elementEventProbe;
}

type InternalNode = {
  dom: Node;
  scope: DisposableScope;
  key?: string;
  foreign?: boolean;
};

function createText(value: string): InternalNode {
  return { dom: document.createTextNode(value), scope: new DisposableScope() };
}

function createFromSpec(spec: ViewSpec, refs: Record<string, HTMLElement>): InternalNode | null {
  if (spec === null || spec === undefined || spec === false) {
    return null;
  }
  if (typeof spec === 'string' || typeof spec === 'number') {
    return createText(String(spec));
  }
  if (Array.isArray(spec)) {
    const frag = document.createDocumentFragment();
    const scope = new DisposableScope();
    for (const child of flatten(spec)) {
      const node = createFromSpec(child, refs);
      if (node) {
        frag.append(node.dom);
        scope.disposable(() => {
          node.scope.dispose();
        });
      }
    }
    return { dom: frag, scope };
  }
  if (isForeign(spec)) {
    const host = document.createElement('div');
    host.className = className(spec.class) || 'ocm-foreign';
    const scope = new DisposableScope();
    try {
      spec.foreign(host, scope);
    } catch (error) {
      console.error('ViewSpec foreign mount failed', error);
    }
    return { dom: host, scope, key: spec.key, foreign: true };
  }
  if (isTeleport(spec)) {
    const scope = new DisposableScope();
    const children = flatten(spec.children);
    const portal = createPortal(children.length === 1 ? children[0] : children, {
      to: spec.to ?? 'body',
      className: spec.className,
    });
    scope.own(portal);
    // Vue-style anchor in the local tree; real DOM lives in the portal root.
    const marker = document.createComment('ocm-teleport');
    return { dom: marker, scope, key: spec.key };
  }
  if (!isElement(spec)) {
    return null;
  }
  if (spec.tag === 'fragment') {
    const frag = document.createDocumentFragment();
    const scope = new DisposableScope();
    for (const child of flatten(spec.children)) {
      const node = createFromSpec(child, refs);
      if (node) {
        frag.append(node.dom);
        scope.disposable(() => {
          node.scope.dispose();
        });
      }
    }
    return { dom: frag, scope, key: spec.key };
  }
  const el = document.createElement(spec.tag);
  el.className = className(spec.class);
  applyAttrs(el, spec.attrs);
  applyStyle(el, spec.style);
  applyProps(el, spec.props);
  const scope = new DisposableScope();
  bindEvents(el, spec.on, scope);
  if (spec.ref) {
    refs[spec.ref] = el;
  }
  for (const child of flatten(spec.children)) {
    const node = createFromSpec(child, refs);
    if (node) {
      el.append(node.dom);
      scope.disposable(() => {
        node.scope.dispose();
      });
    }
  }
  return { dom: el, scope, key: spec.key };
}

/**
 * Mount a ViewSpec into `parent` (replaces children).
 * Core owns all DOM creation and event wiring.
 */
export function mount(parent: HTMLElement, spec: ViewSpec): MountHandle {
  const refs: Record<string, HTMLElement> = {};
  let rootScope = new DisposableScope();
  let current = spec;

  const paint = (next: ViewSpec) => {
    rootScope.dispose();
    rootScope = new DisposableScope();
    for (const k of Object.keys(refs)) {
      delete refs[k];
    }
    parent.replaceChildren();
    const node = createFromSpec(next, refs);
    if (node) {
      parent.append(node.dom);
      rootScope.disposable(() => {
        node.scope.dispose();
      });
    }
    current = next;
  };

  paint(spec);

  return {
    el: parent,
    refs,
    update(next: ViewSpec) {
      // Simple replace strategy (keyed patch can be layered later).
      if (next === current) {
        return;
      }
      paint(next);
    },
    destroy() {
      rootScope.dispose();
      parent.replaceChildren();
    },
  };
}

/**
 * Mount a ViewSpec into a portal target (Vue `<Teleport to="…">`).
 * Pass `null` for an empty host (transient anchors, file inputs).
 * Call `destroy()` or `scope.own(portal)`.
 */
export function createPortal(
  spec: ViewSpec | null | undefined,
  opts: PortalOptions = {}
): PortalHandle {
  const target = getPortalRoot(opts.to ?? 'body');
  const host = document.createElement('div');
  host.className = opts.className ? `ocm-portal-host ${opts.className}` : 'ocm-portal-host';
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      host.setAttribute(k, v);
    }
  }
  target.append(host);

  const useEmpty = spec === null || spec === undefined || spec === false;
  let handle: MountHandle = useEmpty
    ? {
        el: host,
        refs: {},
        update() {
          /* replaced on first real update via PortalHandle.update */
        },
        destroy() {
          host.replaceChildren();
        },
      }
    : mount(host, spec);

  let mounted = !useEmpty;
  const scope = new DisposableScope();
  scope.disposable(() => {
    handle.destroy();
  });

  return {
    el: host,
    get mount() {
      return handle;
    },
    update(next) {
      if (!mounted) {
        handle = mount(host, next);
        mounted = true;
        return;
      }
      handle.update(next);
    },
    destroy() {
      scope.dispose();
      host.remove();
    },
  };
}

/**
 * Build a detached element via ViewSpec.
 * Scratch host uses createElement once inside the SDK (plugins must not).
 * Event scopes stay alive on the returned element until `destroy()`.
 */
export function renderDetached(spec: ViewSpec): { el: HTMLElement; destroy: () => void } {
  const host = document.createElement('div');
  const handle = mount(host, spec);
  const child = host.firstElementChild;
  if (!(child instanceof HTMLElement)) {
    handle.destroy();
    throw new Error('renderDetached: ViewSpec must produce an HTMLElement root');
  }
  child.remove();
  return {
    el: child,
    destroy: () => {
      handle.destroy();
    },
  };
}

/** Serialize a ViewSpec to an HTML string (export / publish boundary). */
export function viewToHtml(spec: ViewSpec): string {
  const { el, destroy } = renderDetached(spec);
  const html = el.outerHTML;
  destroy();
  return html;
}
