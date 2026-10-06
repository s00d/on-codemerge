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

type NodeKind = 'text' | 'element' | 'foreign' | 'fragment' | 'teleport';

type InternalNode = {
  dom: Node;
  scope: DisposableScope;
  children: InternalNode[];
  key?: string;
  kind: NodeKind;
  tag?: string;
  attrKeys: string[];
  styleKeys: string[];
  refName?: string;
};

function specKey(spec: ViewSpec): string | undefined {
  if (spec !== null && typeof spec === 'object' && !Array.isArray(spec) && 'key' in spec) {
    return spec.key;
  }
  return undefined;
}

function attrKeyList(attrs: ViewElementSpec['attrs']): string[] {
  return attrs ? Object.keys(attrs) : [];
}

function styleKeyList(style: ViewElementSpec['style']): string[] {
  return style ? Object.keys(style) : [];
}

function patchAttrs(el: HTMLElement, prevKeys: string[], next: ViewElementSpec['attrs']): string[] {
  const nextKeys = attrKeyList(next);
  for (const k of prevKeys) {
    if (!nextKeys.includes(k)) {
      el.removeAttribute(k);
    }
  }
  applyAttrs(el, next);
  return nextKeys;
}

function patchStyle(el: HTMLElement, prevKeys: string[], next: ViewElementSpec['style']): string[] {
  const nextKeys = styleKeyList(next);
  for (const k of prevKeys) {
    if (!nextKeys.includes(k)) {
      if (k.startsWith('--')) {
        el.style.removeProperty(k);
      } else {
        Reflect.set(el.style, k, '');
      }
    }
  }
  applyStyle(el, next);
  return nextKeys;
}

function moveDom(parent: ParentNode, node: Node, before: Node | null): void {
  if (node.parentNode === parent && node === before) {
    return;
  }
  const host = parent as ParentNode & {
    moveBefore?: (n: Node, b: Node | null) => void;
  };
  if (typeof host.moveBefore === 'function' && node instanceof Element) {
    try {
      host.moveBefore(node, before);
      return;
    } catch {
      /* insertBefore fallback */
    }
  }
  if (before instanceof Element || before instanceof CharacterData) {
    before.before(node);
  } else {
    parent.append(node);
  }
}

function destroyNode(node: InternalNode): void {
  for (const child of node.children) {
    destroyNode(child);
  }
  node.scope.dispose();
  node.dom.parentNode?.removeChild(node.dom);
}

function compatible(old: InternalNode, spec: ViewSpec): boolean {
  if (typeof spec === 'string' || typeof spec === 'number') {
    return old.kind === 'text';
  }
  if (isForeign(spec)) {
    return old.kind === 'foreign';
  }
  if (isTeleport(spec)) {
    return old.kind === 'teleport';
  }
  if (isElement(spec)) {
    if (spec.tag === 'fragment') {
      return old.kind === 'fragment';
    }
    return old.kind === 'element' && old.tag === spec.tag;
  }
  return false;
}

function createText(value: string): InternalNode {
  return {
    dom: document.createTextNode(value),
    scope: new DisposableScope(),
    children: [],
    kind: 'text',
    attrKeys: [],
    styleKeys: [],
  };
}

function createFromSpec(spec: ViewSpec, refs: Record<string, HTMLElement>): InternalNode | null {
  if (spec === null || spec === undefined || spec === false) {
    return null;
  }
  if (typeof spec === 'string' || typeof spec === 'number') {
    return createText(String(spec));
  }
  if (Array.isArray(spec) || (isElement(spec) && spec.tag === 'fragment')) {
    const kids = flatten(Array.isArray(spec) ? spec : spec.children);
    const children: InternalNode[] = [];
    const frag = document.createDocumentFragment();
    for (const child of kids) {
      const node = createFromSpec(child, refs);
      if (node) {
        frag.append(node.dom);
        children.push(node);
      }
    }
    return {
      dom: frag,
      scope: new DisposableScope(),
      children,
      kind: 'fragment',
      key: Array.isArray(spec) ? undefined : spec.key,
      attrKeys: [],
      styleKeys: [],
    };
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
    return {
      dom: host,
      scope,
      children: [],
      key: spec.key,
      kind: 'foreign',
      attrKeys: [],
      styleKeys: [],
    };
  }
  if (isTeleport(spec)) {
    const scope = new DisposableScope();
    const children = flatten(spec.children);
    const portal = createPortal(children.length === 1 ? children[0] : children, {
      to: spec.to ?? 'body',
      className: spec.className,
    });
    scope.own(portal);
    const marker = document.createComment('ocm-teleport');
    return {
      dom: marker,
      scope,
      children: [],
      key: spec.key,
      kind: 'teleport',
      attrKeys: [],
      styleKeys: [],
    };
  }
  if (!isElement(spec)) {
    return null;
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
  const children: InternalNode[] = [];
  for (const child of flatten(spec.children)) {
    const node = createFromSpec(child, refs);
    if (node) {
      if (node.kind === 'fragment') {
        el.append(node.dom);
        children.push(...node.children);
      } else {
        el.append(node.dom);
        children.push(node);
      }
    }
  }
  return {
    dom: el,
    scope,
    children,
    key: spec.key,
    kind: 'element',
    tag: spec.tag,
    attrKeys: attrKeyList(spec.attrs),
    styleKeys: styleKeyList(spec.style),
    refName: spec.ref,
  };
}

function patchNode(
  old: InternalNode,
  spec: ViewSpec,
  refs: Record<string, HTMLElement>
): InternalNode {
  if (typeof spec === 'string' || typeof spec === 'number') {
    const next = String(spec);
    if (old.dom.textContent !== next) {
      old.dom.textContent = next;
    }
    return old;
  }
  if (isForeign(spec) && old.kind === 'foreign' && old.dom instanceof HTMLElement) {
    old.dom.className = className(spec.class) || 'ocm-foreign';
    return old;
  }
  if (isTeleport(spec) && old.kind === 'teleport') {
    return old;
  }
  if (isElement(spec) && spec.tag !== 'fragment' && old.kind === 'element') {
    if (!(old.dom instanceof HTMLElement)) {
      const created = createFromSpec(spec, refs);
      if (!created) {
        destroyNode(old);
        return old;
      }
      old.dom.parentNode?.replaceChild(created.dom, old.dom);
      destroyNode(old);
      return created;
    }
    const el = old.dom;
    el.className = className(spec.class);
    old.attrKeys = patchAttrs(el, old.attrKeys, spec.attrs);
    old.styleKeys = patchStyle(el, old.styleKeys, spec.style);
    applyProps(el, spec.props);
    old.scope.dispose();
    old.scope = new DisposableScope();
    bindEvents(el, spec.on, old.scope);
    if (old.refName && old.refName !== spec.ref) {
      delete refs[old.refName];
    }
    if (spec.ref) {
      refs[spec.ref] = el;
    }
    old.refName = spec.ref;
    old.key = spec.key;
    old.children = setChildren(el, old.children, flatten(spec.children), refs);
    return old;
  }
  const created = createFromSpec(spec, refs);
  if (!created) {
    destroyNode(old);
    return old;
  }
  old.dom.parentNode?.replaceChild(created.dom, old.dom);
  destroyNode(old);
  return created;
}

function setChildren(
  parent: HTMLElement,
  oldKids: InternalNode[],
  nextSpecs: ViewSpec[],
  refs: Record<string, HTMLElement>
): InternalNode[] {
  const oldByKey = new Map<string, InternalNode>();
  for (const kid of oldKids) {
    if (kid.key) {
      oldByKey.set(kid.key, kid);
    }
  }
  const used = new Set<InternalNode>();
  const unkeyed = oldKids.filter((k) => !k.key);
  let unkeyedAt = 0;
  const result: InternalNode[] = [];

  for (const spec of nextSpecs) {
    const key = specKey(spec);
    let prev: InternalNode | undefined;
    if (key) {
      prev = oldByKey.get(key);
    } else {
      while (unkeyedAt < unkeyed.length) {
        const cand = unkeyed[unkeyedAt];
        unkeyedAt += 1;
        if (cand !== undefined && !used.has(cand) && compatible(cand, spec)) {
          prev = cand;
          break;
        }
      }
    }
    if (prev && compatible(prev, spec) && !used.has(prev)) {
      used.add(prev);
      result.push(patchNode(prev, spec, refs));
    } else {
      const created = createFromSpec(spec, refs);
      if (created) {
        if (created.kind === 'fragment') {
          result.push(...created.children);
        } else {
          result.push(created);
        }
      }
    }
  }

  for (const kid of oldKids) {
    if (!used.has(kid)) {
      destroyNode(kid);
    }
  }

  let before: Node | null = parent.firstChild;
  for (const node of result) {
    if (node.dom.parentNode !== parent || node.dom !== before) {
      moveDom(parent, node.dom, before);
    }
    before = node.dom.nextSibling;
  }
  return result;
}

function rootsFromSpec(spec: ViewSpec, refs: Record<string, HTMLElement>): InternalNode[] {
  const list = flatten(
    isElement(spec) && spec.tag === 'fragment' ? spec.children : Array.isArray(spec) ? spec : spec
  );
  const roots: InternalNode[] = [];
  for (const item of list) {
    const node = createFromSpec(item, refs);
    if (!node) {
      continue;
    }
    if (node.kind === 'fragment') {
      roots.push(...node.children);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * Mount a ViewSpec into `parent` (replaces children).
 * Core owns all DOM creation and event wiring.
 */
export function mount(parent: HTMLElement, spec: ViewSpec): MountHandle {
  const refs: Record<string, HTMLElement> = {};
  let current = spec;
  let roots: InternalNode[] = [];

  const paint = (next: ViewSpec, first: boolean) => {
    for (const k of Object.keys(refs)) {
      delete refs[k];
    }
    const list = flatten(
      isElement(next) && next.tag === 'fragment' ? next.children : Array.isArray(next) ? next : next
    );
    if (first) {
      parent.replaceChildren();
      roots = rootsFromSpec(next, refs);
      for (const node of roots) {
        parent.append(node.dom);
      }
    } else {
      roots = setChildren(parent, roots, list, refs);
    }
    current = next;
  };

  paint(spec, true);

  return {
    el: parent,
    refs,
    update(next: ViewSpec) {
      if (next === current) {
        return;
      }
      paint(next, false);
    },
    destroy() {
      for (const node of roots) {
        destroyNode(node);
      }
      roots = [];
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
