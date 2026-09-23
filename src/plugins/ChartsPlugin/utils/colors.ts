import { hueStrip, hexToRgb, cssColorToHex } from '../../../utils/colorMath';

/** Procedural default series palette (no hardcoded product swatches). */
export const CHART_COLORS = hueStrip(10);

export function getRandomColor(): string {
  return CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)];
}

export function colorWithOpacity(color: string | undefined, opacity: number): string {
  const hex = cssColorToHex(color ?? '') ?? color ?? getRandomColor();
  const rgb = hexToRgb(hex);
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }
  if (hex.startsWith('rgb')) {
    const values = hex.match(/\d+/g);
    if (!values || values.length < 3) {
      return hex;
    }
    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`;
  }
  return hex;
}
