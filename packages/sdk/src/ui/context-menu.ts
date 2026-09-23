import { DisposableScope } from '../disposable';
import { menuTv } from './chrome';
import { applyPlaceRoot, applyPlaceSubmenu } from './place';
import { createPortal, h } from './view';
import type { PortalHandle, ViewSpec } from './view';

export interface MenuItem {
  label?: string;
  title?: string;
  /** Safe SVG/markup string rendered via innerHTML only for trusted icon assets. */
  icon?: string;
  onClick?: () => void;
  disabled?: boolean | (() => boolean);
  type?: 'button' | 'divider' | 'group';
  groupTitle?: string;
  subMenu?: MenuItem[];
  variant?: 'default' | 'danger';
}

export type MenuPosition = { x: number; y: number } | { anchor: DOMRect };

/** Core-owned context menu — ViewSpec; teleported to `menu` portal. */
export class ContextMenuService {
  private active: {
    portal: PortalHandle;
    scope: DisposableScope;
  } | null = null;
  private readonly ui = menuTv();
  private readonly portalTo: 'menu' | HTMLElement;

  constructor(_root?: HTMLElement, portalTo: 'menu' | HTMLElement = 'menu') {
    this.portalTo = portalTo;
  }

  get isOpen(): boolean {
    return this.active !== null;
  }

  private itemSpec(item: MenuItem, hide: () => void): ViewSpec {
    if (item.type === 'divider') {
      return h('div', { class: this.ui.divider() });
    }
    const disabled = typeof item.disabled === 'function' ? item.disabled() : item.disabled;
    return h(
      'button',
      {
        class: menuTv({ danger: item.variant === 'danger' }).item(),
        attrs: {
          type: 'button',
          role: 'menuitem',
          disabled: disabled ? true : undefined,
        },
        on: {
          click: () => {
            if (disabled) {
              return;
            }
            item.onClick?.();
            hide();
          },
        },
      },
      item.icon ? h('span', { class: 'ocm-menu-icon', props: { innerHTML: item.icon } }) : null,
      h('span', { class: 'ocm-menu-label' }, item.label ?? item.title ?? '')
    );
  }

  private subWrapSpec(item: MenuItem, hide: () => void, index: number): ViewSpec {
    return h(
      'div',
      { class: 'ocm-menu-subwrap', ref: `subwrap-${index}` },
      h(
        'button',
        {
          class: `${menuTv().item()} ocm-menu-subwrap__trigger`,
          ref: `subtrigger-${index}`,
          attrs: {
            type: 'button',
            role: 'menuitem',
            'aria-haspopup': 'true',
          },
          on: {
            click: (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
            },
          },
        },
        item.icon ? h('span', { class: 'ocm-menu-icon', props: { innerHTML: item.icon } }) : null,
        h('span', { class: 'ocm-menu-label' }, item.label ?? item.title ?? ''),
        h('span', {
          class: 'ocm-menu-subwrap__chevron',
          props: {
            innerHTML:
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
          },
        })
      ),
      h(
        'div',
        {
          class: `${this.ui.root()} ocm-menu-subwrap__panel`,
          ref: `subpanel-${index}`,
          style: { position: 'absolute', top: '0' },
          attrs: { hidden: true, role: 'menu' },
        },
        ...(item.subMenu ?? []).map((s) => this.itemSpec(s, hide))
      )
    );
  }

  private buildSpec(items: MenuItem[], x: number, y: number, hide: () => void): ViewSpec {
    const children: ViewSpec[] = [];
    let subIndex = 0;
    for (const item of items) {
      if (item.type === 'divider') {
        children.push(h('div', { class: this.ui.divider() }));
        continue;
      }
      if (item.type === 'group' && item.groupTitle) {
        children.push(h('div', { class: this.ui.groupTitle() }, item.groupTitle));
        for (const sub of item.subMenu ?? []) {
          children.push(this.itemSpec(sub, hide));
        }
        continue;
      }
      if (item.subMenu && item.subMenu.length > 0 && item.type !== 'group') {
        children.push(this.subWrapSpec(item, hide, subIndex));
        subIndex += 1;
        continue;
      }
      children.push(this.itemSpec(item, hide));
    }

    return h(
      'div',
      {
        class: this.ui.root(),
        ref: 'root',
        attrs: { role: 'menu' },
        style: {
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          zIndex: '1100',
        },
      },
      ...children
    );
  }

  open(items: MenuItem[], xOrPos: number | MenuPosition, y?: number): void {
    this.hide();
    let x = 0;
    let yPos = 0;
    let anchor: { x: number; y: number } | DOMRect = { x: 0, y: 0 };
    if (typeof xOrPos === 'number') {
      x = xOrPos;
      yPos = y ?? 0;
      anchor = { x, y: yPos };
    } else if ('anchor' in xOrPos) {
      x = xOrPos.anchor.left;
      yPos = xOrPos.anchor.bottom;
      anchor = xOrPos.anchor;
    } else {
      x = xOrPos.x;
      yPos = xOrPos.y;
      anchor = { x, y: yPos };
    }

    const scope = new DisposableScope();
    const hide = () => {
      this.hide();
    };
    const portal = createPortal(this.buildSpec(items, x, yPos, hide), {
      to: this.portalTo,
      className: 'ocm-menu-root',
    });
    scope.own(portal);

    const menuEl = portal.mount.refs.root;
    if (menuEl !== undefined) {
      applyPlaceRoot(menuEl, anchor, { prefer: 'below' });
    }

    const onOut = (e: MouseEvent) => {
      if (!(e.target instanceof Node) || !portal.el.contains(e.target)) {
        hide();
      }
    };
    scope.timeout(0, () => {
      scope.on(document, 'mousedown', onOut);
      scope.on(globalThis, 'scroll', hide, true);
      scope.on(globalThis, 'resize', hide);
    });

    for (let i = 0; ; i += 1) {
      const wrap = portal.mount.refs[`subwrap-${i}`];
      const trigger = portal.mount.refs[`subtrigger-${i}`];
      const sub = portal.mount.refs[`subpanel-${i}`];
      if (wrap === undefined || trigger === undefined || sub === undefined) {
        break;
      }
      scope.on(wrap, 'mouseenter', () => {
        sub.hidden = false;
        applyPlaceSubmenu(sub, trigger);
      });
      scope.on(wrap, 'mouseleave', () => {
        sub.hidden = true;
      });
    }

    this.active = { portal, scope };
  }

  hide(): void {
    if (!this.active) {
      return;
    }
    this.active.scope.dispose();
    this.active = null;
  }

  destroy(): void {
    this.hide();
  }
}
