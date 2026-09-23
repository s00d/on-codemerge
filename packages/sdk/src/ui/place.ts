export type PlacePoint = { x: number; y: number };
export type PlaceAnchor = PlacePoint | DOMRectLike;

export type DOMRectLike = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type ViewportSize = { width: number; height: number };
export type BoxSize = { width: number; height: number };

export type PlaceRootResult = {
  left: number;
  top: number;
  vertical: 'above' | 'below';
  horizontal: 'start' | 'end';
};

export type PlaceSubmenuResult = {
  /** CSS: open to the right of trigger when `right`, else to the left. */
  side: 'left' | 'right';
  /** Offset from trigger top (px); may be negative to flip upward. */
  top: number;
};

function isRect(a: PlaceAnchor): a is DOMRectLike {
  return typeof a === 'object' && a !== null && 'width' in a && 'height' in a;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

/**
 * Place a fixed menu near a click point or DOMRect.
 * Prefers below + aligned to start; flips above/end when space runs out; clamps to pad.
 */
export function placeRoot(
  size: BoxSize,
  anchor: PlaceAnchor,
  viewport: ViewportSize,
  opts?: { pad?: number; prefer?: 'below' | 'above' }
): PlaceRootResult {
  const pad = opts?.pad ?? 8;
  const prefer = opts?.prefer ?? 'below';

  let ax: number;
  let ayBelow: number;
  let ayAbove: number;
  if (isRect(anchor)) {
    ax = anchor.left;
    ayBelow = anchor.bottom;
    ayAbove = anchor.top - size.height;
  } else {
    ax = anchor.x;
    ayBelow = anchor.y;
    ayAbove = anchor.y - size.height;
  }

  const maxLeft = Math.max(pad, viewport.width - size.width - pad);
  const maxTop = Math.max(pad, viewport.height - size.height - pad);

  let vertical: 'above' | 'below' = prefer;
  let top = prefer === 'below' ? ayBelow : ayAbove;
  if (prefer === 'below') {
    if (ayBelow + size.height > viewport.height - pad && ayAbove >= pad) {
      vertical = 'above';
      top = ayAbove;
    }
  } else if (ayAbove < pad && ayBelow + size.height <= viewport.height - pad) {
    vertical = 'below';
    top = ayBelow;
  }

  let horizontal: 'start' | 'end' = 'start';
  let left = ax;
  if (left + size.width > viewport.width - pad) {
    horizontal = 'end';
    left = isRect(anchor) ? anchor.right - size.width : anchor.x - size.width;
  }

  left = clamp(left, pad, maxLeft);
  top = clamp(top, pad, maxTop);

  return { left, top, vertical, horizontal };
}

/**
 * Place a submenu panel relative to its trigger (parent item).
 * Prefers opening to the right; flips left / shifts vertically when clipped.
 */
export function placeSubmenu(
  size: BoxSize,
  trigger: DOMRectLike,
  viewport: ViewportSize,
  opts?: { pad?: number; gap?: number }
): PlaceSubmenuResult {
  const pad = opts?.pad ?? 8;
  const gap = opts?.gap ?? 2;

  const spaceRight = viewport.width - trigger.right - gap - pad;
  const spaceLeft = trigger.left - gap - pad;
  const side: 'left' | 'right' =
    size.width <= spaceRight || spaceRight >= spaceLeft ? 'right' : 'left';

  let top = 0;
  const absTop = trigger.top;
  if (absTop + size.height > viewport.height - pad) {
    top = viewport.height - pad - size.height - absTop;
  }
  if (absTop + top < pad) {
    top = pad - absTop;
  }

  return { side, top };
}

/** Apply `placeRoot` to a `position:fixed` element using live measurements. */
export function applyPlaceRoot(
  el: HTMLElement,
  anchor: PlaceAnchor,
  opts?: { pad?: number; prefer?: 'below' | 'above' }
): PlaceRootResult {
  const size = { width: el.offsetWidth || 1, height: el.offsetHeight || 1 };
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const placed = placeRoot(size, anchor, viewport, opts);
  el.style.left = `${Math.round(placed.left)}px`;
  el.style.top = `${Math.round(placed.top)}px`;
  return placed;
}

/**
 * Apply `placeSubmenu` to an absolutely-positioned submenu panel.
 * Sets `left`/`right`/`top` relative to the positioned trigger wrap.
 */
export function applyPlaceSubmenu(
  panel: HTMLElement,
  trigger: HTMLElement,
  opts?: { pad?: number; gap?: number }
): PlaceSubmenuResult {
  const size = { width: panel.offsetWidth || 1, height: panel.offsetHeight || 1 };
  const triggerRect = trigger.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const placed = placeSubmenu(size, triggerRect, viewport, opts);
  const gap = opts?.gap ?? 2;

  panel.style.top = `${Math.round(placed.top)}px`;
  if (placed.side === 'right') {
    panel.style.left = `calc(100% + ${gap}px)`;
    panel.style.right = 'auto';
  } else {
    panel.style.right = `calc(100% + ${gap}px)`;
    panel.style.left = 'auto';
  }
  return placed;
}
