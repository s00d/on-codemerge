import { labelLines } from '../layout/text';
import type { ResolvedTheme } from '../types';
import { escapeXml } from './escape';

const LINE_H = 14;

export function fontAttrs(theme: ResolvedTheme, size = 12): string {
  return `font-size="${size}" font-family="${escapeXml(theme.font)}"`;
}

/** Multiline label centered in a box. Uses real newlines. */
export function renderCenteredText(
  label: string,
  cx: number,
  cy: number,
  theme: ResolvedTheme,
  size = 12
): string {
  if (label === '') {
    return '';
  }
  const lines = labelLines(label);
  const startY = cy - ((lines.length - 1) * LINE_H) / 2 + 4;
  const parts: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const y = startY + i * LINE_H;
    parts.push(
      `<text x="${cx}" y="${y}" text-anchor="middle" ${fontAttrs(theme, size)} fill="${escapeXml(theme.fg)}">${escapeXml(lines[i] ?? '')}</text>`
    );
  }
  return parts.join('');
}

export function renderSimpleText(
  text: string,
  x: number,
  y: number,
  theme: ResolvedTheme,
  opts: { size?: number; anchor?: string; weight?: string; fill?: string } = {}
): string {
  const size = opts.size ?? 12;
  const anchor = opts.anchor ?? 'middle';
  const weight = opts.weight !== undefined ? ` font-weight="${opts.weight}"` : '';
  const fill = escapeXml(opts.fill ?? theme.fg);
  return `<text x="${x}" y="${y}" text-anchor="${anchor}"${weight} ${fontAttrs(theme, size)} fill="${fill}">${escapeXml(text)}</text>`;
}
