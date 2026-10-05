export type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';

/** @deprecated Use ResizeHandle — kept for existing call sites. */
export type ResizeCorner = ResizeHandle;

export type ResizeStart = {
  width: number;
  height: number;
};

export type ResizeDelta = {
  dx: number;
  dy: number;
};

export type ResizeBounds = {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
};

export type ComputeResizeInput = {
  corner: ResizeHandle;
  start: ResizeStart;
  delta: ResizeDelta;
  bounds: ResizeBounds;
  /** When true, keep width/height ratio (from start or explicit aspectRatio). */
  aspectLock: boolean;
  /** width/height; defaults to start.width / start.height when locking. */
  aspectRatio?: number;
};

export type ComputeResizeResult = {
  width: number;
  height: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

/**
 * Pure resize math for corner + edge handles.
 * Positive dx/dy = pointer moved right/down from drag start.
 */
export function computeResize(input: ComputeResizeInput): ComputeResizeResult {
  const { corner, start, delta, bounds, aspectLock } = input;
  const ratio = input.aspectRatio ?? (start.height > 0 ? start.width / start.height : 1);

  let width = start.width;
  let height = start.height;

  switch (corner) {
    case 'se': {
      width = start.width + delta.dx;
      height = start.height + delta.dy;
      break;
    }
    case 'sw': {
      width = start.width - delta.dx;
      height = start.height + delta.dy;
      break;
    }
    case 'ne': {
      width = start.width + delta.dx;
      height = start.height - delta.dy;
      break;
    }
    case 'nw': {
      width = start.width - delta.dx;
      height = start.height - delta.dy;
      break;
    }
    case 'e': {
      width = start.width + delta.dx;
      height = start.height;
      break;
    }
    case 'w': {
      width = start.width - delta.dx;
      height = start.height;
      break;
    }
    case 's': {
      width = start.width;
      height = start.height + delta.dy;
      break;
    }
    case 'n': {
      width = start.width;
      height = start.height - delta.dy;
      break;
    }
  }

  if (aspectLock && ratio > 0) {
    if (corner === 'e' || corner === 'w') {
      width = Math.max(bounds.minWidth, width);
      height = width / ratio;
    } else if (corner === 'n' || corner === 's') {
      height = Math.max(bounds.minHeight, height);
      width = height * ratio;
    } else {
      // Drive by the dominant axis of the pointer delta for this corner.
      const absX = Math.abs(delta.dx);
      const absY = Math.abs(delta.dy);
      if (absX >= absY) {
        width = Math.max(bounds.minWidth, width);
        height = width / ratio;
      } else {
        height = Math.max(bounds.minHeight, height);
        width = height * ratio;
      }
    }
  }

  const maxW = bounds.maxWidth ?? Number.POSITIVE_INFINITY;
  const maxH = bounds.maxHeight ?? Number.POSITIVE_INFINITY;

  width = clamp(width, bounds.minWidth, maxW);
  height = clamp(height, bounds.minHeight, maxH);

  if (aspectLock && ratio > 0) {
    // Re-sync after clamp so both axes stay in ratio and inside bounds.
    const byWidth = { width, height: width / ratio };
    const byHeight = { width: height * ratio, height };
    const widthFits = byWidth.height >= bounds.minHeight && byWidth.height <= maxH;
    const heightFits = byHeight.width >= bounds.minWidth && byHeight.width <= maxW;
    if (
      widthFits &&
      (!heightFits ||
        Math.abs(byWidth.width - start.width) >= Math.abs(byHeight.width - start.width))
    ) {
      width = byWidth.width;
      height = byWidth.height;
    } else if (heightFits) {
      width = byHeight.width;
      height = byHeight.height;
    }
    width = clamp(width, bounds.minWidth, maxW);
    height = clamp(height, bounds.minHeight, maxH);
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/** Whether Shift should toggle lock given default aspect mode. */
export function effectiveAspectLock(defaultAspect: 'lock' | 'free', shiftKey: boolean): boolean {
  return defaultAspect === 'lock' ? !shiftKey : shiftKey;
}
