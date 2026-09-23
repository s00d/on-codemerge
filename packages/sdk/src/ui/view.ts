import { DisposableScope } from '../disposable';
import type { Ownable } from '../disposable';
import { getPortalRoot, isTeleport, teleport } from './portal';
import type { PortalOptions, ViewTeleportSpec } from './portal';

export { teleport } from './portal';

export type ViewEventMap = {
  [K in keyof HTMLElementEventMap]?: (ev: HTMLElementEventMap[K]) => void;
};

export type ViewElementSpec = {
  tag: keyof HTMLElementTagNameMap | 'fragment';
  class?: string | string[];
  attrs?: Record<string, string | number | boolean | null | undefined>;
  style?: Record<string, string | number>;
  props?: Record<string, unknown>;
  on?: ViewEventMap;
  children?: ViewSpec | ViewSpec[];
  key?: string;
  ref?: string;
};

export type ViewForeignSpec = {
  /** Escape hatch: host is SDK-owned; use scope.own / scope.slot for teardown. */
  foreign: (host: HTMLElement, scope: DisposableScope) => void;
  key?: string;
  class?: string | string[];
};

export type ViewSpec =
  | string
  | number
  | null
  | undefined
  | false
  | ViewElementSpec
  | ViewForeignSpec
  | ViewTeleportSpec
  | ViewSpec[];

export interface MountHandle {
  readonly el: HTMLElement;
  readonly refs: Record<string, HTMLElement>;
  update(spec: ViewSpec): void;
  destroy(): void;
}

export interface PortalHandle extends Ownable {
  readonly el: HTMLElement;
  readonly mount: MountHandle;
  update(spec: ViewSpec): void;
  destroy(): void;
}

type Props = {
  class?: string | string[];
  attrs?: Record<string, string | number | boolean | null | undefined>;
  style?: Record<string, string | number>;
  props?: Record<string, unknown>;
  on?: ViewEventMap;
  key?: string;
  ref?: string;
};

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

/** Hyperscript helper — builds a ViewElementSpec. */
export function h(
  tag: keyof HTMLElementTagNameMap | 'fragment',
  props: Props | null = null,
  ...children: ViewSpec[]
): ViewElementSpec {
  const p = props ?? {};
  return {
    tag,
    class: p.class,
    attrs: p.attrs,
    style: p.style,
    props: p.props,
    on: p.on,
    key: p.key,
    ref: p.ref,
    children: children.length === 1 ? children[0] : children,
  };
}

export function text(value: string | number): string {
  return String(value);
}

export function fragment(...children: ViewSpec[]): ViewElementSpec {
  return h('fragment', null, ...children);
}

export function foreign(
  mountFn: (host: HTMLElement, scope: DisposableScope) => void,
  opts: { key?: string; class?: string | string[] } = {}
): ViewForeignSpec {
  return { foreign: mountFn, key: opts.key, class: opts.class };
}

export function img(props: Props & { src: string; alt?: string }): ViewElementSpec {
  return h('img', {
    ...props,
    attrs: { ...props.attrs, src: props.src, alt: props.alt ?? '' },
  });
}

export function video(props: Props & { src: string; controls?: boolean }): ViewElementSpec {
  return h('video', {
    ...props,
    props: { ...props.props, controls: props.controls !== false, src: props.src },
    attrs: { ...props.attrs, src: props.src },
  });
}

export function iframe(
  props: Props & { src: string; width?: string | number; height?: string | number }
): ViewElementSpec {
  return h('iframe', {
    ...props,
    attrs: {
      ...props.attrs,
      src: props.src,
      width: props.width,
      height: props.height,
      frameborder: '0',
      allowfullscreen: true,
    },
  });
}

export function canvas(props: Props & { width?: number; height?: number } = {}): ViewElementSpec {
  return h('canvas', {
    ...props,
    attrs: {
      ...props.attrs,
      width: props.width,
      height: props.height,
    },
  });
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
      (el.style as unknown as Record<string, string>)[k] = value;
    }
  }
}

function applyProps(el: HTMLElement, props: ViewElementSpec['props']): void {
  if (!props) {
    return;
  }
  for (const [k, v] of Object.entries(props)) {
    (el as unknown as Record<string, unknown>)[k] = v;
  }
}

function bindEvents(el: HTMLElement, on: ViewEventMap | undefined, scope: DisposableScope): void {
  if (on === undefined) {
    return;
  }
  for (const [type, handler] of Object.entries(on)) {
    if (handler === undefined) {
      continue;
    }
    scope.on(el, type as keyof HTMLElementEventMap, handler as (ev: Event) => void);
  }
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

/** Convenience: patch = handle.update */
export function patch(handle: MountHandle, next: ViewSpec): void {
  handle.update(next);
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

/** Click a temporary download anchor via portal. */
export function downloadUrl(url: string, filename: string): void {
  const { el, destroy } = renderDetached(
    h('a', {
      attrs: { href: url, download: filename },
      style: { display: 'none' },
    })
  );
  const portal = createPortal(null, { to: 'body', className: 'ocm-portal-host--transient' });
  portal.el.append(el);
  (el as HTMLAnchorElement).click();
  el.remove();
  destroy();
  portal.destroy();
}

/** Blob → object URL → downloadUrl. */
export function downloadBlob(content: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
}

/** Hidden file picker via portal. */
export function pickFile(
  opts: {
    accept?: string;
    multiple?: boolean;
  } = {}
): Promise<FileList | null> {
  return new Promise((resolve) => {
    const portal = createPortal(null, { to: 'body', className: 'ocm-portal-host--transient' });
    const { el, destroy } = renderDetached(
      h('input', {
        attrs: {
          type: 'file',
          accept: opts.accept,
          multiple: opts.multiple ? true : undefined,
        },
        style: { display: 'none' },
        on: {
          change: (e) => {
            resolve((e.target as HTMLInputElement).files);
            el.remove();
            destroy();
            portal.destroy();
          },
        },
      })
    );
    portal.el.append(el);
    (el as HTMLInputElement).click();
  });
}

/** Namespace object for plugins: ui.h / ui.mount / ui.teleport / … */
export const ui = {
  h,
  text,
  fragment,
  foreign,
  teleport,
  img,
  video,
  iframe,
  canvas,
  mount,
  patch,
  renderDetached,
  viewToHtml,
  createPortal,
  downloadUrl,
  downloadBlob,
  pickFile,
};
