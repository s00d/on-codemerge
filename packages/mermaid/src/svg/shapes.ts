import type { PositionedNode, ResolvedTheme } from '../types';
import { escapeXml } from './escape';
import { renderCenteredText } from './labels';

export type NodeChrome = { fill: string; stroke: string };

export function renderNode(
  node: PositionedNode,
  theme: ResolvedTheme,
  chrome?: NodeChrome
): string {
  const fill = escapeXml(chrome?.fill ?? theme.surface);
  const stroke = escapeXml(chrome?.stroke ?? theme.border);
  const { x, y, width, height, shape } = node;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const label = renderCenteredText(node.label, cx, cy, theme);

  if (shape === 'start' || shape === 'end') {
    const r = Math.min(width, height) / 2;
    if (shape === 'end') {
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${escapeXml(theme.fg)}" stroke="${stroke}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="${escapeXml(theme.bg)}" stroke="none"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${escapeXml(theme.fg)}" stroke="${stroke}" stroke-width="1.5"/>`;
  }

  if (shape === 'circle') {
    const r = Math.min(width, height) / 2;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${label}`;
  }

  if (shape === 'diamond') {
    const pts = `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${label}`;
  }

  if (shape === 'odd') {
    // Asymmetric flag / odd shape (Mermaid `id>Label]`).
    const notch = Math.min(14, width * 0.22);
    const pts = `${x},${y} ${x + width - notch},${y} ${x + width},${cy} ${x + width - notch},${y + height} ${x},${y + height}`;
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" data-ocm-shape="odd"/>${label}`;
  }

  if (shape === 'stadium' || shape === 'rounded') {
    const rx = shape === 'stadium' ? height / 2 : 8;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ry="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${label}`;
  }

  if (shape === 'cyl') {
    const ry = Math.min(10, height / 4);
    return `<ellipse cx="${cx}" cy="${y + ry}" rx="${width / 2}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M${x},${y + ry} L${x},${y + height - ry} A${width / 2},${ry} 0 0 0 ${x + width},${y + height - ry} L${x + width},${y + ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${label}`;
  }

  // Square rect — sharp corners (Mermaid `[]`).
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="0" ry="0" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${label}`;
}
