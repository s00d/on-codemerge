/** Normalized crop rectangle in image pixel space (x/y/w/h ≥ 0, within bounds). */

export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AspectPreset = 'free' | '1:1' | '16:9' | '4:3';

export function aspectRatioOf(preset: AspectPreset): number | null {
  if (preset === '1:1') {
    return 1;
  }
  if (preset === '16:9') {
    return 16 / 9;
  }
  if (preset === '4:3') {
    return 4 / 3;
  }
  return null;
}

export function fullFrame(nw: number, nh: number): CropRect {
  return { x: 0, y: 0, w: Math.max(1, nw), h: Math.max(1, nh) };
}

/** Clamp + optional aspect lock. Minimum edge 8px. */
export function clampCrop(
  rect: CropRect,
  nw: number,
  nh: number,
  aspect: number | null = null
): CropRect {
  const min = 8;
  let { x, y, w, h } = rect;
  w = Math.max(min, w);
  h = Math.max(min, h);

  if (aspect !== null && aspect > 0) {
    if (w / h > aspect) {
      w = h * aspect;
    } else {
      h = w / aspect;
    }
    w = Math.max(min, Math.min(w, nw));
    h = Math.max(min, Math.min(h, nh));
    if (w / h > aspect) {
      w = h * aspect;
    } else {
      h = w / aspect;
    }
  }

  w = Math.min(w, nw);
  h = Math.min(h, nh);
  x = Math.min(Math.max(0, x), Math.max(0, nw - w));
  y = Math.min(Math.max(0, y), Math.max(0, nh - h));
  return { x, y, w: Math.max(min, w), h: Math.max(min, h) };
}

export function applyAspectPreset(nw: number, nh: number, preset: AspectPreset): CropRect {
  const ratio = aspectRatioOf(preset);
  if (ratio === null) {
    return fullFrame(nw, nh);
  }
  let w = nw;
  let h = w / ratio;
  if (h > nh) {
    h = nh;
    w = h * ratio;
  }
  const x = (nw - w) / 2;
  const y = (nh - h) / 2;
  return clampCrop({ x, y, w, h }, nw, nh, ratio);
}

/** Display scale: fit image into maxBox keeping aspect. */
export function fitScale(nw: number, nh: number, maxW: number, maxH: number): number {
  if (nw <= 0 || nh <= 0) {
    return 1;
  }
  return Math.min(maxW / nw, maxH / nh, 1);
}
