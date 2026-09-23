import { h, renderDetached } from '@on-codemerge/sdk';

import { computeResize, effectiveAspectLock } from './resizeMath';
import type { ResizeHandle } from './resizeMath';

export type ResizerAspect = 'lock' | 'free';

export type ResizerOptions = {
  aspect?: ResizerAspect;
  handles?: ResizeHandle[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  showBadge?: boolean;
  onResizeStart?: () => void;
  onResize?: (width: number, height: number, e?: PointerEvent) => void;
  onResizeEnd?: (width: number, height: number) => void;
  onCancel?: () => void;
  /** Fired when selection should clear (outside click or Escape). */
  onBlur?: () => void;
};

const ALL_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const CURSOR: Record<ResizeHandle, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
};

type Detached = { el: HTMLElement; destroy: () => void };

/**
 * Selection-frame resizer: 8 handles (corners + edges), optional size badge,
 * aspect lock, pointer capture, Escape cancel, outside blur.
 */
export class Resizer {
  private readonly element: HTMLElement;
  private readonly options: Required<
    Pick<ResizerOptions, 'aspect' | 'handles' | 'minWidth' | 'minHeight' | 'showBadge'>
  > &
    ResizerOptions;

  private frame: Detached | null = null;
  private badge: Detached | null = null;
  private readonly handleNodes: Detached[] = [];
  private savedOverflow: string | null = null;

  private dragging = false;
  private activeHandle: ResizeHandle | null = null;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private lastWidth = 0;
  private lastHeight = 0;
  private activePointerId: number | null = null;

  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onPointerUp: (e: PointerEvent) => void;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onDocPointerDown: (e: PointerEvent) => void;

  constructor(element: HTMLElement, options: ResizerOptions = {}) {
    this.element = element;
    this.options = {
      aspect: 'free',
      handles: ALL_HANDLES,
      minWidth: 50,
      minHeight: 50,
      showBadge: true,
      ...options,
    };

    this.onPointerMove = (e) => {
      this.handlePointerMove(e);
    };
    this.onPointerUp = (e) => {
      this.handlePointerUp(e);
    };
    this.onKeyDown = (e) => {
      this.handleKeyDown(e);
    };
    this.onDocPointerDown = (e) => {
      this.handleDocPointerDown(e);
    };

    this.mountChrome();
    document.addEventListener('pointerdown', this.onDocPointerDown, true);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  private mountChrome(): void {
    this.teardownChrome();

    const computed = getComputedStyle(this.element);
    if (computed.position === 'static') {
      this.element.style.position = 'relative';
    }
    // Edge/corner handles sit slightly outside the box — avoid clip.
    if (computed.overflow !== 'visible') {
      this.savedOverflow = this.element.style.overflow;
      this.element.style.overflow = 'visible';
    }
    this.element.classList.add('ocm-resize--selected');

    this.frame = renderDetached(
      h('div', { class: 'ocm-resize-frame', attrs: { 'aria-hidden': 'true' } })
    );
    this.element.append(this.frame.el);

    for (const handle of this.options.handles) {
      const built = renderDetached(
        h('div', {
          class: `ocm-resize-handle ocm-resize-handle--${handle}`,
          attrs: {
            'data-resize-corner': handle,
            'data-resize-handle': handle,
            role: 'slider',
            'aria-label': `Resize ${handle}`,
            tabindex: '-1',
          },
          style: { cursor: CURSOR[handle] },
          on: {
            pointerdown: (e) => {
              this.startDrag(handle, e);
            },
          },
        })
      );
      this.handleNodes.push(built);
      this.element.append(built.el);
    }

    if (this.options.showBadge) {
      this.badge = renderDetached(
        h('div', {
          class: 'ocm-resize-badge',
          attrs: { 'aria-hidden': 'true' },
        })
      );
      this.badge.el.hidden = true;
      this.element.append(this.badge.el);
    }
  }

  private teardownChrome(): void {
    this.element.classList.remove('ocm-resize--selected', 'ocm-resize--active');
    if (this.savedOverflow !== null) {
      this.element.style.overflow = this.savedOverflow;
      this.savedOverflow = null;
    }
    this.frame?.destroy();
    this.frame?.el.remove();
    this.frame = null;
    this.badge?.destroy();
    this.badge?.el.remove();
    this.badge = null;
    for (const node of this.handleNodes) {
      node.destroy();
      node.el.remove();
    }
    this.handleNodes.length = 0;
    this.element
      .querySelectorAll('.ocm-resize-frame, .ocm-resize-handle, .ocm-resize-badge, .resize-handle')
      .forEach((n) => {
        n.remove();
      });
  }

  private startDrag(handle: ResizeHandle, e: PointerEvent): void {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    this.dragging = true;
    this.activeHandle = handle;
    this.activePointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = this.element.offsetWidth;
    this.startHeight = this.element.offsetHeight;
    this.lastWidth = this.startWidth;
    this.lastHeight = this.startHeight;

    this.element.classList.add('ocm-resize--active');
    document.documentElement.classList.add('ocm-resizing');
    document.documentElement.style.setProperty('cursor', CURSOR[handle]);

    if (this.badge) {
      this.badge.el.hidden = false;
      this.updateBadge(this.startWidth, this.startHeight);
    }

    const target = e.currentTarget as HTMLElement;
    if (typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        /* jsdom / detached */
      }
    }

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerUp);

    this.options.onResizeStart?.();
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.dragging || !this.activeHandle) {
      return;
    }
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) {
      return;
    }

    const lock = effectiveAspectLock(this.options.aspect, e.shiftKey);
    const { width, height } = computeResize({
      corner: this.activeHandle,
      start: { width: this.startWidth, height: this.startHeight },
      delta: { dx: e.clientX - this.startX, dy: e.clientY - this.startY },
      bounds: {
        minWidth: this.options.minWidth,
        minHeight: this.options.minHeight,
        maxWidth: this.options.maxWidth,
        maxHeight: this.options.maxHeight,
      },
      aspectLock: lock,
    });

    this.applySize(width, height);
    this.options.onResize?.(width, height, e);
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) {
      return;
    }
    this.finishDrag(false);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Escape') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (this.dragging) {
      this.applySize(this.startWidth, this.startHeight);
      this.finishDrag(true);
      this.options.onCancel?.();
    }
    this.options.onBlur?.();
  }

  private handleDocPointerDown(e: PointerEvent): void {
    if (this.dragging) {
      return;
    }
    const target = e.target as Node | null;
    if (target && this.element.contains(target)) {
      return;
    }
    this.options.onBlur?.();
  }

  private finishDrag(cancelled: boolean): void {
    this.dragging = false;
    this.activeHandle = null;
    this.activePointerId = null;

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerUp);

    this.element.classList.remove('ocm-resize--active');
    document.documentElement.classList.remove('ocm-resizing');
    document.documentElement.style.removeProperty('cursor');

    if (this.badge) {
      this.badge.el.hidden = true;
    }

    if (!cancelled) {
      this.options.onResizeEnd?.(this.lastWidth, this.lastHeight);
    }
  }

  private applySize(width: number, height: number): void {
    this.lastWidth = width;
    this.lastHeight = height;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.updateBadge(width, height);
  }

  private updateBadge(width: number, height: number): void {
    if (this.badge === null || this.badge.el.hidden === true) {
      return;
    }
    this.badge.el.textContent = `${width} × ${height}`;
  }

  public destroy(): void {
    if (this.dragging) {
      this.finishDrag(true);
    }
    document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.teardownChrome();
  }
}
