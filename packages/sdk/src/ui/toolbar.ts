import { DisposableScope } from '../disposable';
import { toolbarTv } from './chrome';
import { applyPlaceRoot } from './place';
import { createPortal, h, mount as mountView, renderDetached } from './view';
import type { MountHandle, PortalHandle, ViewSpec } from './view';

/** Static text or locale-reactive resolver (re-read on every `refresh`). */
export type ToolbarText = string | (() => string);

function resolveToolbarText(value: ToolbarText | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === 'function' ? value() : value;
}

export interface ToolbarButton {
  id: string;
  label?: ToolbarText;
  icon?: string;
  title?: ToolbarText;
  command?: string;
  onClick?: () => void;
  /** Bar segment for separators (ignored when `menu` is set). */
  group?: string;
  order?: number;
  /** Drop into a named overflow menu instead of the top-level bar. */
  menu?: string;
  active?: () => boolean;
  disabled?: () => boolean;
}

export interface ToolbarMenuDef {
  id: string;
  label?: ToolbarText;
  icon?: string;
  title?: ToolbarText;
  order?: number;
  /** Bar segment for the menu trigger. */
  group?: string;
}

export type ToolbarAction =
  | { kind: 'button'; id: string }
  | { kind: 'menu'; id: string; open: boolean }
  | { kind: 'menu-item'; menuId: string; id: string };

type ToolbarActionListener = (action: ToolbarAction) => void;

const GROUP_ORDER: Record<string, number> = {
  marks: 10,
  history: 20,
  format: 30,
  insert: 40,
  review: 50,
  overlay: 55,
  collab: 58,
  tools: 60,
  divider: 99,
};

const CHEVRON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

function groupRank(group: string | undefined): number {
  if (!group) {
    return 1000;
  }
  return GROUP_ORDER[group] ?? 500;
}

function compareBarItems(
  a: { group?: string; order?: number; id: string },
  b: { group?: string; order?: number; id: string }
): number {
  const g = groupRank(a.group) - groupRank(b.group);
  if (g !== 0) {
    return g;
  }
  const o = (a.order ?? 0) - (b.order ?? 0);
  if (o !== 0) {
    return o;
  }
  return a.id.localeCompare(b.id);
}

/**
 * Core-owned toolbar panel. Plugins register buttons / menus via add / defineMenu.
 * Shell + buttons via ViewSpec (no local createElement).
 */
export class ToolbarPanel {
  readonly el: HTMLElement;
  private readonly buttons = new Map<string, ToolbarButton>();
  private readonly menus = new Map<string, ToolbarMenuDef>();
  private readonly bar: HTMLElement;
  private barMount: MountHandle | null = null;
  private openMenu: { id: string; portal: PortalHandle; scope: DisposableScope } | null = null;
  private readonly onCommand: (name: string) => void;
  private readonly ui = toolbarTv();
  private readonly shellDestroy: () => void;
  private readonly listeners = new Set<ToolbarActionListener>();
  /** Pointer is over a menu trigger or its open panel — no timers. */
  private overTrigger = false;
  private overPanel = false;

  constructor(host: HTMLElement, onCommand: (name: string) => void) {
    this.onCommand = onCommand;
    const shell = renderDetached(
      h(
        'div',
        { class: this.ui.host(), ref: 'host' },
        h('div', { class: this.ui.bar(), attrs: { role: 'toolbar' }, ref: 'bar' })
      )
    );
    this.el = shell.el;
    const firstChild = shell.el.firstElementChild;
    this.bar = firstChild instanceof HTMLElement ? firstChild : shell.el;
    this.shellDestroy = shell.destroy;
    host.prepend(this.el);
    // Leaving the whole toolbar (not into the open panel) drops hover menus.
    this.el.addEventListener('pointerleave', (e) => {
      const to = e.relatedTarget;
      // Still inside the bar (sibling trigger / button) — ignore.
      if (to instanceof Node && this.el.contains(to)) {
        return;
      }
      if (to instanceof Node && this.openMenu?.portal.el.contains(to)) {
        return;
      }
      this.clearHover();
      this.syncHoverClose();
    });
    this.render();
  }

  /** Bar node (same element PageChrome floats via CSS). */
  get barElement(): HTMLElement {
    return this.bar;
  }

  /** Host shell (`.ocm-toolbar-host`) — PageChrome toggles float on this node. */
  get hostElement(): HTMLElement {
    return this.el;
  }

  /** Typed chrome events — prefer this over DOM class hit-tests. */
  subscribe(listener: ToolbarActionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(action: ToolbarAction): void {
    for (const listener of this.listeners) {
      listener(action);
    }
  }

  /** Register / update a named overflow menu (idempotent). */
  defineMenu(def: ToolbarMenuDef): () => void {
    this.menus.set(def.id, { ...this.menus.get(def.id), ...def, id: def.id });
    this.render();
    return () => {
      this.menus.delete(def.id);
      if (this.openMenu?.id === def.id) {
        this.hideMenu();
      }
      this.render();
    };
  }

  add(btn: ToolbarButton): () => void {
    this.buttons.set(btn.id, btn);
    this.render();
    return () => {
      this.buttons.delete(btn.id);
      this.render();
    };
  }

  remove(id: string): void {
    this.buttons.delete(id);
    this.menus.delete(id);
    if (this.openMenu?.id === id) {
      this.hideMenu();
    }
    this.render();
  }

  clear(): void {
    this.hideMenu();
    this.buttons.clear();
    this.menus.clear();
    this.render();
  }

  refresh(): void {
    this.render();
  }

  private runButton(btn: ToolbarButton): void {
    if (btn.disabled?.()) {
      return;
    }
    if (this.openMenu) {
      this.clearHover();
      this.hideMenu();
      this.render();
    }
    this.emit({ kind: 'button', id: btn.id });
    if (btn.onClick) {
      btn.onClick();
    } else if (btn.command) {
      this.onCommand(btn.command);
    }
  }

  private menuItems(menuId: string): ToolbarButton[] {
    return [...this.buttons.values()]
      .filter((b) => b.menu === menuId)
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));
  }

  private clearHover(): void {
    this.overTrigger = false;
    this.overPanel = false;
  }

  private hideMenu(): void {
    if (!this.openMenu) {
      return;
    }
    const id = this.openMenu.id;
    this.openMenu.scope.dispose();
    this.openMenu = null;
    this.emit({ kind: 'menu', id, open: false });
  }

  /** Close when pointer left both trigger and panel. */
  private syncHoverClose(): void {
    if (this.overTrigger || this.overPanel || !this.openMenu) {
      return;
    }
    this.hideMenu();
    this.render();
  }

  private toggleMenu(menuId: string, anchor: HTMLElement): void {
    if (this.openMenu?.id === menuId) {
      this.clearHover();
      this.hideMenu();
      this.render();
      return;
    }
    this.overTrigger = true;
    this.showMenu(menuId, anchor);
  }

  private showMenu(menuId: string, anchor: HTMLElement): void {
    if (this.openMenu?.id === menuId) {
      return;
    }
    this.hideMenu();
    const items = this.menuItems(menuId);
    if (items.length === 0) {
      this.render();
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const scope = new DisposableScope();
    const hide = () => {
      this.clearHover();
      this.hideMenu();
      this.render();
    };
    const children: ViewSpec[] = items.map((btn) => {
      const disabled = Boolean(btn.disabled?.());
      const active = Boolean(btn.active?.());
      const title = resolveToolbarText(btn.title);
      const label = resolveToolbarText(btn.label) ?? title ?? btn.id;
      return h(
        'button',
        {
          class: toolbarTv({ active }).menuItem(),
          attrs: {
            type: 'button',
            role: 'menuitem',
            'data-id': btn.id,
            disabled: disabled ? true : undefined,
            title,
          },
          on: {
            click: () => {
              if (disabled) {
                return;
              }
              this.emit({ kind: 'menu-item', menuId, id: btn.id });
              this.runButton(btn);
              hide();
            },
          },
        },
        btn.icon
          ? h('span', { class: 'ocm-toolbar-menu__icon', props: { innerHTML: btn.icon } })
          : null,
        h('span', { class: 'ocm-toolbar-menu__label' }, label)
      );
    });

    const portal = createPortal(
      h(
        'div',
        {
          class: this.ui.menu(),
          ref: 'menu',
          attrs: { role: 'menu', 'data-ocm-toolbar-menu': menuId },
          style: {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.bottom}px`,
            zIndex: '1100',
          },
          on: {
            pointerenter: () => {
              this.overPanel = true;
            },
            pointerleave: () => {
              this.overPanel = false;
              this.syncHoverClose();
            },
          },
        },
        ...children
      ),
      { to: 'menu', className: 'ocm-toolbar-menu-root' }
    );
    scope.own(portal);

    const el = portal.mount.refs.menu;
    if (el !== undefined) {
      applyPlaceRoot(el, rect, { prefer: 'below' });
    }

    scope.timeout(0, () => {
      scope.on(document, 'mousedown', (e) => {
        if (!(e.target instanceof Node)) {
          return;
        }
        if (portal.el.contains(e.target) || this.el.contains(e.target)) {
          return;
        }
        hide();
      });
      scope.on(document, 'keydown', (e) => {
        if (e.key === 'Escape') {
          hide();
        }
      });
      scope.on(globalThis, 'scroll', hide, true);
      scope.on(globalThis, 'resize', hide);
    });

    this.openMenu = { id: menuId, portal, scope };
    this.emit({ kind: 'menu', id: menuId, open: true });
    this.render();
  }

  private buttonSpec(btn: ToolbarButton): ViewSpec {
    const active = Boolean(btn.active?.());
    const disabled = Boolean(btn.disabled?.());
    const title = resolveToolbarText(btn.title);
    const label = resolveToolbarText(btn.label);
    return h(
      'button',
      {
        class: toolbarTv({ active }).btn(),
        attrs: {
          type: 'button',
          title,
          'data-id': btn.id,
          disabled: disabled ? true : undefined,
        },
        props: btn.icon ? { innerHTML: btn.icon } : undefined,
        on: {
          mousedown: (e) => {
            // Keep editor selection when pressing toolbar (button would steal focus).
            e.preventDefault();
          },
          click: (e) => {
            e.preventDefault();
            this.runButton(btn);
          },
        },
      },
      btn.icon ? null : (label ?? btn.id)
    );
  }

  private menuTriggerSpec(def: ToolbarMenuDef): ViewSpec {
    const open = this.openMenu?.id === def.id;
    const label = resolveToolbarText(def.label) ?? resolveToolbarText(def.title) ?? def.id;
    return h(
      'button',
      {
        class: toolbarTv({ active: open }).btn({ class: 'ocm-toolbar__btn--menu' }),
        attrs: {
          type: 'button',
          title: resolveToolbarText(def.title) ?? label,
          'data-id': `menu-${def.id}`,
          'data-menu': def.id,
          'aria-haspopup': 'menu',
          'aria-expanded': open ? 'true' : 'false',
        },
        on: {
          mousedown: (e) => {
            e.preventDefault();
          },
          click: (e) => {
            e.preventDefault();
            const trigger = e.currentTarget;
            if (!(trigger instanceof HTMLElement)) {
              return;
            }
            this.toggleMenu(def.id, trigger);
          },
          pointerenter: (e) => {
            this.overTrigger = true;
            const trigger = e.currentTarget;
            if (!(trigger instanceof HTMLElement)) {
              return;
            }
            this.showMenu(def.id, trigger);
          },
          pointerleave: (e) => {
            // Bar remount replaces the node — ignore leave on the detached trigger.
            const trigger = e.currentTarget;
            if (!(trigger instanceof Node) || !trigger.isConnected) {
              return;
            }
            const to = e.relatedTarget;
            if (to instanceof Node && this.openMenu?.portal.el.contains(to)) {
              this.overTrigger = false;
              this.overPanel = true;
              return;
            }
            this.overTrigger = false;
            // Still on the toolbar — another trigger's enter or host leave decides.
            if (to instanceof Node && this.el.contains(to)) {
              return;
            }
            this.syncHoverClose();
          },
        },
      },
      def.icon
        ? h('span', { class: 'ocm-toolbar__menu-icon', props: { innerHTML: def.icon } })
        : h('span', { class: 'ocm-toolbar__menu-label' }, label),
      h('span', { class: 'ocm-toolbar__chevron', props: { innerHTML: CHEVRON_SVG } })
    );
  }

  private barSpec(): ViewSpec {
    type BarEntry = { kind: 'btn'; btn: ToolbarButton } | { kind: 'menu'; def: ToolbarMenuDef };

    const entries: BarEntry[] = [];
    for (const btn of this.buttons.values()) {
      if (btn.menu) {
        continue;
      }
      entries.push({ kind: 'btn', btn });
    }
    for (const def of this.menus.values()) {
      if (this.menuItems(def.id).length === 0) {
        continue;
      }
      entries.push({ kind: 'menu', def });
    }

    entries.sort((a, b) => {
      const aa = a.kind === 'btn' ? a.btn : a.def;
      const bb = b.kind === 'btn' ? b.btn : b.def;
      return compareBarItems(aa, bb);
    });

    const children: ViewSpec[] = [];
    let lastGroup = '';
    for (const entry of entries) {
      const group = entry.kind === 'btn' ? entry.btn.group : entry.def.group;
      if (group && group !== lastGroup) {
        if (lastGroup) {
          children.push(h('span', { class: this.ui.sep() }));
        }
        lastGroup = group;
      } else if (!group && lastGroup) {
        children.push(h('span', { class: this.ui.sep() }));
        lastGroup = '';
      }
      children.push(
        entry.kind === 'btn' ? this.buttonSpec(entry.btn) : this.menuTriggerSpec(entry.def)
      );
    }
    return h('fragment', null, ...children);
  }

  private render(): void {
    this.barMount?.destroy();
    this.barMount = mountView(this.bar, this.barSpec());
  }

  destroy(): void {
    this.clearHover();
    this.hideMenu();
    this.listeners.clear();
    this.barMount?.destroy();
    this.barMount = null;
    this.el.remove();
    this.shellDestroy();
    this.buttons.clear();
    this.menus.clear();
  }
}
