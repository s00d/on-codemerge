import type { DisposableScope, Ownable } from './disposable';

/** Built-in targets — Vue Teleport–style named outlets. */
export type PortalTargetName =
  | 'body'
  | 'menu'
  | 'popup'
  | 'notify'
  | (string & Record<never, never>);

export type PortalTo = PortalTargetName | HTMLElement;

export interface PortalOptions {
  /** Where to teleport. Default `'body'`. */
  to?: PortalTo;
  /** Class on the portal host wrapper. */
  className?: string;
  /** Extra attrs on the host. */
  attrs?: Record<string, string>;
}

/** Declarative Teleport node for ViewSpec trees. */
export type ViewTeleportSpec = {
  teleport: true;
  to?: PortalTo;
  className?: string;
  children?: ViewSpec | ViewSpec[];
  key?: string;
};

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

export type HProps = {
  class?: string | string[];
  attrs?: Record<string, string | number | boolean | null | undefined>;
  style?: Record<string, string | number>;
  props?: Record<string, unknown>;
  on?: ViewEventMap;
  key?: string;
  ref?: string;
};
