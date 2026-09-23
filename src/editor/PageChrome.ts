import { DisposableScope, getPortalRoot } from '@on-codemerge/sdk';
import type { ToolbarAction, ToolbarPanel } from '@on-codemerge/sdk';

const PAD = 8;
const OPEN_CLASS = 'is-page-open';

/**
 * Page chrome: keep the real toolbar host in place (no DOM move).
 * Closed = CSS hidden. Open = same host as `position:fixed` float.
 * Dismiss / keep-open decisions come from typed ToolbarAction events — not class hit-tests.
 */
export class PageChrome {
  private readonly scope = new DisposableScope();
  private openScope: DisposableScope | null = null;
  private readonly toolbarHost: HTMLElement;
  private readonly toolbar: ToolbarPanel;
  private open = false;
  private unsubToolbar: (() => void) | null = null;

  constructor(
    private readonly content: HTMLElement,
    toolbar: ToolbarPanel
  ) {
    this.toolbarHost = toolbar.el;
    this.toolbar = toolbar;
  }

  start(): void {
    // Critical: never let the bar steal focus / move the caret.
    this.scope.on(
      this.toolbarHost,
      'mousedown',
      (e) => {
        e.preventDefault();
      },
      true
    );

    this.scope.on(this.content, 'mouseup', (e) => {
      this.onContentMouseUp(e);
    });

    this.unsubToolbar = this.toolbar.subscribe((action) => {
      this.onToolbarAction(action);
    });
  }

  destroy(): void {
    this.hide();
    this.unsubToolbar?.();
    this.unsubToolbar = null;
    this.scope.dispose();
  }

  get isOpen(): boolean {
    return this.open;
  }

  private onToolbarAction(action: ToolbarAction): void {
    if (!this.open) {
      return;
    }
    if (action.kind === 'menu') {
      // Dropdown open/close — keep the page float visible.
      return;
    }
    // Regular button or overflow menu item chosen → dismiss float.
    this.hide();
  }

  private onContentMouseUp(e: MouseEvent): void {
    if (e.button !== 0) {
      return;
    }
    const t = e.target;
    if (t instanceof Node && this.toolbarHost.contains(t)) {
      return;
    }
    if (t instanceof Node && getPortalRoot('menu').contains(t)) {
      return;
    }

    if (this.open) {
      this.toolbar.refresh();
      return;
    }

    this.show(this.anchorRect(e));
  }

  private anchorRect(e: MouseEvent): DOMRect {
    const sel = document.getSelection();
    if (sel && this.selectionInContent(sel) && sel.rangeCount > 0) {
      try {
        const range = sel.getRangeAt(0);
        const r =
          typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
        if (r && (r.width > 0 || r.height > 0)) {
          return r;
        }
      } catch {
        // jsdom / detached selection
      }
    }
    return new DOMRect(e.clientX, e.clientY, 0, 0);
  }

  private selectionInContent(sel: Selection): boolean {
    const node = sel.anchorNode;
    return Boolean(node && this.content.contains(node));
  }

  private show(anchor: DOMRect): void {
    this.toolbar.refresh();
    this.open = true;
    this.toolbarHost.classList.add(OPEN_CLASS);
    this.place(anchor);

    const openScope = new DisposableScope();
    this.openScope = openScope;

    openScope.on(document, 'keydown', (ev) => {
      if (ev.key === 'Escape') {
        this.hide();
      }
    });

    // Defer so the opening mouseup does not immediately dismiss.
    openScope.timeout(0, () => {
      openScope.on(document, 'pointerdown', (ev) => {
        const target = ev.target;
        if (!(target instanceof Node)) {
          return;
        }
        if (this.toolbarHost.contains(target)) {
          return;
        }
        if (getPortalRoot('menu').contains(target)) {
          return;
        }
        if (getPortalRoot('popup').contains(target)) {
          // Modal interaction — dismiss float (stays under dialogs via z-index).
          this.hide();
          return;
        }
        if (this.content.contains(target)) {
          return;
        }
        this.hide();
      });
    });

    openScope.on(
      window,
      'scroll',
      () => {
        this.hide();
      },
      true
    );
    openScope.on(window, 'resize', () => {
      this.hide();
    });
  }

  private place(anchor: DOMRect): void {
    const el = this.toolbarHost;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchor.left;
    let top = anchor.top - 48 - PAD;
    if (top < PAD) {
      top = anchor.bottom + PAD;
    }
    left = Math.max(PAD, Math.min(left, vw - 200 - PAD));
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;

    requestAnimationFrame(() => {
      if (!this.open) {
        return;
      }
      const pw = el.offsetWidth || 320;
      const ph = el.offsetHeight || 44;
      let x = anchor.left + anchor.width / 2 - pw / 2;
      let y = anchor.top - ph - PAD;
      if (y < PAD) {
        y = anchor.bottom + PAD;
      }
      x = Math.max(PAD, Math.min(x, vw - pw - PAD));
      y = Math.max(PAD, Math.min(y, vh - ph - PAD));
      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y)}px`;
    });
  }

  hide(): void {
    if (this.openScope) {
      this.openScope.dispose();
      this.openScope = null;
    }
    this.open = false;
    this.toolbarHost.classList.remove(OPEN_CLASS);
    this.toolbarHost.style.left = '';
    this.toolbarHost.style.top = '';
  }
}
