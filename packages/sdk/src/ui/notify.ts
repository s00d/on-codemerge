import { DisposableScope } from '../disposable';
import { notifyTv } from './chrome';
import type { PopupService } from './popup';
import { createPortal, h } from './view';
import type { PortalHandle, ViewSpec } from './view';

export interface NotifyOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

/** Core-owned toasts + confirm — teleported to `notify` portal. */
export class NotifyService {
  private readonly popup: PopupService | null;
  private portal: PortalHandle | null = null;
  private readonly toasts: { id: number; message: string; type: NotifyOptions['type'] }[] = [];
  private nextId = 1;
  private readonly toastScopes = new Map<number, DisposableScope>();
  private readonly ui = notifyTv();
  private readonly portalTo: 'notify' | HTMLElement;

  constructor(
    _root?: HTMLElement,
    popup: PopupService | null = null,
    portalTo: 'notify' | HTMLElement = 'notify'
  ) {
    this.popup = popup;
    this.portalTo = portalTo;
  }

  private ensurePortal(): PortalHandle {
    if (this.portal) {
      return this.portal;
    }
    this.portal = createPortal(null, { to: this.portalTo, className: 'ocm-notify-root' });
    return this.portal;
  }

  private paintContainer(): void {
    const portal = this.ensurePortal();
    const spec: ViewSpec = h(
      'div',
      { class: this.ui.container() },
      ...this.toasts.map((t) =>
        h(
          'div',
          { class: notifyTv({ type: t.type ?? 'info' }).toast(), key: `t-${t.id}` },
          t.message
        )
      )
    );
    portal.update(spec);
  }

  show(options: NotifyOptions): void {
    const id = this.nextId++;
    this.toasts.push({ id, message: options.message, type: options.type ?? 'info' });
    this.paintContainer();
    const ms = options.duration ?? 3000;
    if (ms > 0) {
      const scope = new DisposableScope();
      this.toastScopes.set(id, scope);
      scope.timeout(ms, () => {
        this.dismiss(id);
      });
    }
  }

  private dismiss(id: number): void {
    const i = this.toasts.findIndex((t) => t.id === id);
    if (i !== -1) {
      this.toasts.splice(i, 1);
    }
    this.toastScopes.get(id)?.dispose();
    this.toastScopes.delete(id);
    this.paintContainer();
  }

  success(message: string): void {
    this.show({ message, type: 'success' });
  }

  error(message: string): void {
    this.show({ message, type: 'error' });
  }

  warning(message: string): void {
    this.show({ message, type: 'warning' });
  }

  info(message: string): void {
    this.show({ message, type: 'info' });
  }

  /** Confirm dialog via PopupService chrome (falls back to window.confirm if no popup). */
  confirm(options: ConfirmOptions | string): Promise<boolean> {
    const opts = typeof options === 'string' ? { message: options } : options;
    if (!this.popup) {
      const msg = opts.title ? `${opts.title}\n\n${opts.message}` : opts.message;
      return Promise.resolve(globalThis.confirm(msg));
    }
    return new Promise((resolve) => {
      this.popup!.open({
        title: opts.title,
        className: 'ocm-confirm',
        closeOnClickOutside: true,
        items: [{ type: 'text', id: 'confirm-msg', value: opts.message }],
        buttons: [
          {
            label: opts.cancelLabel ?? 'Cancel',
            variant: 'secondary',
            onClick: () => {
              resolve(false);
            },
          },
          {
            label: opts.confirmLabel ?? 'OK',
            variant: opts.variant === 'danger' ? 'danger' : 'primary',
            onClick: () => {
              resolve(true);
            },
          },
        ],
      });
    });
  }

  prompt(message: string, defaultValue = ''): Promise<string | null> {
    return Promise.resolve(globalThis.prompt(message, defaultValue));
  }

  destroy(): void {
    for (const scope of this.toastScopes.values()) {
      scope.dispose();
    }
    this.toastScopes.clear();
    this.toasts.length = 0;
    this.portal?.destroy();
    this.portal = null;
  }
}
