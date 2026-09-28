/** HSV ↔ RGB/hex helpers (no deps). Hue is 0–360; s/v are 0–1. */

export type Hsv = { h: number; s: number; v: number };
export type Rgb = { r: number; g: number; b: number };

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function hsvToRgb(h: number, s: number, v: number): Rgb {
  const hh = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) {
    rp = c;
    gp = x;
  } else if (hh < 120) {
    rp = x;
    gp = c;
  } else if (hh < 180) {
    gp = c;
    bp = x;
  } else if (hh < 240) {
    gp = x;
    bp = c;
  } else if (hh < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) {
      h = 60 * (((gg - bb) / d) % 6);
    } else if (max === gg) {
      h = 60 * ((bb - rr) / d + 2);
    } else {
      h = 60 * ((rr - gg) / d + 4);
    }
  }
  if (h < 0) {
    h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hexByte(n: number): string {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}

export function hexToRgb(hex: string): Rgb | null {
  const raw = hex.trim().replace(/^#/, '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

export function hexToHsv(hex: string): Hsv | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b) : null;
}

export function hsvToHex(h: number, s: number, v: number): string {
  return rgbToHex(hsvToRgb(h, s, v));
}

/** Normalize CSS color (hex / rgb / rgba) to `#rrggbb`, or null if unknown. */
export function cssColorToHex(value: string): string | null {
  const v = value.trim();
  if (!v) {
    return null;
  }
  const fromHex = hexToRgb(v);
  if (fromHex) {
    return rgbToHex(fromHex);
  }
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(v);
  if (m) {
    return rgbToHex({
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
    });
  }
  return null;
}

/** Neutrals black → white (generated). */
export function neutrals(count = 9): string[] {
  const n = Math.max(2, count);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const v = 1 - i / (n - 1);
    out.push(hsvToHex(0, 0, v));
  }
  return out;
}

/** Lighter → deeper tones of the current hue (generated). */
export function quickSwatches(hue: number, count = 10): string[] {
  const n = Math.max(2, count);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // light pastel → saturated mid → dark
    const s = 0.25 + t * 0.7;
    const v = 1 - t * 0.55;
    out.push(hsvToHex(hue, s, v));
  }
  return out;
}

/** Full hue ring samples for a compact strip (optional). */
export function hueStrip(count = 12): string[] {
  const n = Math.max(1, count);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(hsvToHex((360 * i) / n, 1, 1));
  }
  return out;
}
