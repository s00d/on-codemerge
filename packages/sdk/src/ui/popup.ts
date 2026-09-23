import type { OwnedSlot } from '../disposable';
import { DisposableScope } from '../disposable';
import { popupTv } from './chrome';
import { createPortal, h } from './view';
import type { PortalHandle, ViewSpec } from './view';

export interface PopupItem {
  type:
    | 'input'
    | 'textarea'
    | 'checkbox'
    | 'list'
    | 'radio'
    | 'number'
    | 'color'
    | 'file'
    | 'url'
    | 'text'
    | 'view'
    | 'divider';
  id: string;
  label?: string;
  placeholder?: string;
  value?: string | boolean | number;
  options?: string[];
  /** Declarative ViewSpec content. */
  view?: ViewSpec | (() => ViewSpec);
  onChange?: (value: string | boolean | number) => void;
}

export interface PopupButton {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (values: Record<string, string | boolean | number>) => void | boolean;
}

export interface PopupOptions {
  title?: string;
  className?: string;
  /** Dialog width: sm ~20rem, md ~28rem, lg ~40rem. */
  size?: 'sm' | 'md' | 'lg';
  items?: PopupItem[];
  buttons?: PopupButton[];
  closeOnClickOutside?: boolean;
}

export interface PopupHandle {
  hide: () => void;
  getValues: () => Record<string, string | boolean | number>;
  update: (options: PopupOptions) => void;
}

/**
 * One active popup bound to a DisposableScope.
 * `open` auto-closes the previous; scope dispose closes the current.
 */
export class PopupController {
  private readonly slot: OwnedSlot<PopupHandle>;
  private readonly openImpl: (options: PopupOptions) => PopupHandle;

  constructor(open: (options: PopupOptions) => PopupHandle, scope: DisposableScope) {
    this.openImpl = open;
    this.slot = scope.slot();
  }

  open(options: PopupOptions): PopupHandle {
    return this.slot.replace(this.openImpl(options))!;
  }

  update(options: PopupOptions): void {
    const cur = this.slot.value;
    if (cur) {
      cur.update(options);
      return;
    }
    this.open(options);
  }

  close(): void {
    this.slot.clear();
  }

  get handle(): PopupHandle | null {
    return this.slot.value;
  }

  get isOpen(): boolean {
    return this.slot.value !== null;
  }
}

type Values = Record<string, string | boolean | number>;

/** Core-owned modal/popup — chrome via ViewSpec; teleported to `popup` portal. */
export class PopupService {
  private active: {
    portal: PortalHandle;
    scope: DisposableScope;
    values: Values;
    /** Identity so stale handles from PopupController.replace don't kill the new popup. */
    id: number;
  } | null = null;
  private nextId = 1;
  private readonly ui = popupTv();
  private readonly portalTo: 'popup' | HTMLElement;
  private scrollLock: { html: string; body: string } | null = null;

  constructor(_root?: HTMLElement, portalTo: 'popup' | HTMLElement = 'popup') {
    this.portalTo = portalTo;
  }

  get isOpen(): boolean {
    return this.active !== null;
  }

  private lockScroll(): void {
    if (this.scrollLock) {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    this.scrollLock = { html: html.style.overflow, body: body.style.overflow };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    if (!this.scrollLock) {
      return;
    }
    document.documentElement.style.overflow = this.scrollLock.html;
    document.body.style.overflow = this.scrollLock.body;
    this.scrollLock = null;
  }

  private fieldSpec(item: PopupItem, values: Values): ViewSpec {
    if (item.type === 'view') {
      const spec = typeof item.view === 'function' ? item.view() : item.view;
      return h('div', { class: 'ocm-popup-view' }, spec ?? null);
    }

    if (item.type === 'textarea') {
      const initial = String(item.value ?? '');
      values[item.id] = initial;
      return h('textarea', {
        class: this.ui.input(),
        attrs: { id: item.id, placeholder: item.placeholder ?? '' },
        props: { value: initial },
        on: {
          input: (e) => {
            const t = e.target;
            if (!(t instanceof HTMLTextAreaElement)) {
              return;
            }
            values[item.id] = t.value;
            item.onChange?.(t.value);
          },
        },
      });
    }

    if (item.type === 'checkbox') {
      const initial = Boolean(item.value);
      values[item.id] = initial;
      return h('input', {
        attrs: { id: item.id, type: 'checkbox' },
        props: { checked: initial },
        on: {
          change: (e) => {
            const t = e.target;
            if (!(t instanceof HTMLInputElement)) {
              return;
            }
            values[item.id] = t.checked;
            item.onChange?.(t.checked);
          },
        },
      });
    }

    if (item.type === 'list' || item.type === 'radio') {
      const initial = String(item.value ?? item.options?.[0] ?? '');
      values[item.id] = initial;
      return h(
        'select',
        {
          class: this.ui.input(),
          attrs: { id: item.id },
          props: { value: initial },
          on: {
            change: (e) => {
              const t = e.target;
              if (!(t instanceof HTMLSelectElement)) {
                return;
              }
              values[item.id] = t.value;
              item.onChange?.(t.value);
            },
          },
        },
        ...(item.options ?? []).map((opt) => h('option', { attrs: { value: opt } }, opt))
      );
    }

    if (item.type === 'text') {
      return h('p', { class: 'ocm-popup__text', attrs: { id: item.id } }, String(item.value ?? ''));
    }

    if (item.type === 'file') {
      values[item.id] = '';
      return h('input', {
        attrs: { id: item.id, type: 'file' },
        on: {
          change: (e) => {
            const t = e.target;
            if (!(t instanceof HTMLInputElement)) {
              return;
            }
            const v = t.files?.[0]?.name ?? '';
            values[item.id] = v;
            item.onChange?.(v);
          },
        },
      });
    }

    const inputType =
      item.type === 'number'
        ? 'number'
        : item.type === 'color'
          ? 'color'
          : item.type === 'url'
            ? 'url'
            : 'text';
    const initial = String(item.value ?? '');
    values[item.id] = item.type === 'number' ? Number(initial) || 0 : initial;
    return h('input', {
      class: this.ui.input(),
      attrs: {
        id: item.id,
        type: inputType,
        placeholder: item.placeholder ?? '',
      },
      props: { value: initial },
      on: {
        input: (e) => {
          const t = e.target;
          if (!(t instanceof HTMLInputElement)) {
            return;
          }
          const v = item.type === 'number' ? Number(t.value) || 0 : t.value;
          values[item.id] = v;
          item.onChange?.(v);
        },
      },
    });
  }

  private itemRow(item: PopupItem, values: Values): ViewSpec {
    if (item.type === 'divider') {
      return h('hr', null);
    }
    if (item.type === 'checkbox') {
      return h('div', { class: `${this.ui.row()} ocm-popup__row--check` }, [
        h('label', { class: 'ocm-popup__check', attrs: { for: item.id } }, [
          this.fieldSpec(item, values),
          item.label ?? '',
        ]),
      ]);
    }
    return h('div', { class: this.ui.row() }, [
      item.label
        ? h('label', { class: this.ui.label(), attrs: { for: item.id } }, item.label)
        : null,
      this.fieldSpec(item, values),
    ]);
  }

  private buildSpec(options: PopupOptions, values: Values, hide: () => void): ViewSpec {
    const header = options.title
      ? h('div', { class: this.ui.header() }, [
          h('span', null, options.title),
          h(
            'button',
            {
              class: this.ui.close(),
              attrs: { type: 'button' },
              on: {
                click: () => {
                  hide();
                },
              },
            },
            '×'
          ),
        ])
      : null;

    const content = h(
      'div',
      { class: this.ui.content() },
      ...(options.items ?? []).map((item) => this.itemRow(item, values))
    );

    const footer =
      options.buttons !== undefined && options.buttons.length > 0
        ? h(
            'div',
            { class: this.ui.footer() },
            ...options.buttons.map((b) =>
              h(
                'button',
                {
                  class: popupTv({ variant: b.variant ?? 'secondary' }).btn(),
                  attrs: { type: 'button' },
                  on: {
                    click: () => {
                      const keep = b.onClick({ ...values });
                      if (keep !== true) {
                        hide();
                      }
                    },
                  },
                },
                b.label
              )
            )
          )
        : null;

    const closeFromOverlay = (e: Event) => {
      if (e.target === e.currentTarget) {
        hide();
      }
    };
    const overlayOn =
      options.closeOnClickOutside === false
        ? undefined
        : {
            // Prefer pointerdown so Playwright/force clicks close reliably.
            pointerdown: closeFromOverlay,
            mousedown: closeFromOverlay,
          };

    return h('div', { class: 'ocm-popup-layer' }, [
      h('div', { class: this.ui.overlay(), on: overlayOn }),
      h(
        'div',
        {
          class: popupTv({ size: options.size ?? 'md' }).popup({ class: options.className }),
          attrs: { role: 'dialog', 'aria-modal': 'true' },
        },
        [header, content, footer]
      ),
    ]);
  }

  open(options: PopupOptions = {}): PopupHandle {
    this.hide();
    const values: Values = {};
    const scope = new DisposableScope();
    const id = this.nextId++;
    const hide = () => {
      // Only tear down if this handle still owns the active popup.
      if (this.active?.id === id) {
        this.hide();
      }
    };

    const portal = createPortal(this.buildSpec(options, values, hide), {
      to: this.portalTo,
      className: 'ocm-popup-root',
    });
    scope.own(portal);
    scope.on(document, 'keydown', (e) => {
      if (e.key === 'Escape') {
        hide();
      }
    });

    this.lockScroll();
    this.active = { portal, scope, values, id };

    return {
      getValues: () => ({ ...(this.active?.id === id ? this.active.values : {}) }),
      hide,
      update: (next) => {
        if (!this.active || this.active.id !== id) {
          this.open(next);
          return;
        }
        const fresh: Values = {};
        this.active.portal.update(this.buildSpec(next, fresh, hide));
        this.active.values = fresh;
      },
    };
  }

  hide(): void {
    if (!this.active) {
      return;
    }
    this.active.scope.dispose();
    this.active = null;
    this.unlockScroll();
  }

  destroy(): void {
    this.hide();
  }
}
