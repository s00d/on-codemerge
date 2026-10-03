import { labelLines } from '../layout/text';
import { EDGE_LABEL_FILL } from '../theme';
import type { PositionedEdge, ResolvedTheme, SequenceEndMarker } from '../types';
import { escapeXml } from './escape';
import { fontAttrs, renderSimpleText } from './labels';

export function renderMarkers(theme: ResolvedTheme): string {
  const fill = escapeXml(theme.accent);
  const stroke = escapeXml(theme.line);
  return `<defs>
  <filter id="ocm-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#18181b" flood-opacity="0.12"/>
  </filter>
  <marker id="ocm-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L10,4 L0,8 z" fill="${fill}"/>
  </marker>
  <marker id="ocm-arrow-open" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L10,4 L0,8" fill="none" stroke="${stroke}" stroke-width="1.5"/>
  </marker>
  <marker id="ocm-cross" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
    <path d="M1,1 L9,9 M9,1 L1,9" fill="none" stroke="${stroke}" stroke-width="1.75"/>
  </marker>
</defs>`;
}

function markerUrl(end: SequenceEndMarker | undefined): string {
  if (end === 'open') {
    return 'url(#ocm-arrow-open)';
  }
  if (end === 'cross') {
    return 'url(#ocm-cross)';
  }
  return 'url(#ocm-arrow)';
}

function renderEdgeLabel(label: string, x: number, y: number, theme: ResolvedTheme): string {
  const lines = labelLines(label);
  const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const padX = 6;
  const padY = 3;
  const lineH = 13;
  const w = Math.max(24, maxLen * 6.2 + padX * 2);
  const h = Math.max(16, lines.length * lineH + padY * 2);
  const rx = x - w / 2;
  const ry = y - h / 2 - 4;
  const parts: string[] = [
    `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" rx="3" ry="3" fill="${escapeXml(EDGE_LABEL_FILL)}" stroke="${escapeXml(theme.border)}" stroke-width="0.75" data-ocm-edge-label="1"/>`,
  ];
  const startY = ry + padY + 11;
  for (let i = 0; i < lines.length; i += 1) {
    parts.push(
      `<text x="${x}" y="${startY + i * lineH}" text-anchor="middle" ${fontAttrs(theme, 11)} fill="${escapeXml(theme.fg)}">${escapeXml(lines[i] ?? '')}</text>`
    );
  }
  return parts.join('');
}

export function renderEdge(edge: PositionedEdge, theme: ResolvedTheme): string {
  if (edge.points.length < 2) {
    return '';
  }
  const d = edge.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const dash = edge.dashed === true ? ' stroke-dasharray="4 3"' : '';
  const width = edge.thick === true ? 2.5 : 1.5;
  const mid = edge.points[Math.floor(edge.points.length / 2)];
  let label = '';
  if (edge.label !== undefined && edge.label !== '' && mid !== undefined) {
    label = renderEdgeLabel(edge.label, mid.x, mid.y - 2, theme);
  }
  return `<path d="${d}" fill="none" stroke="${escapeXml(theme.line)}" stroke-width="${width}"${dash} marker-end="${markerUrl(edge.end)}"/>${label}`;
}

export function renderSimpleEdgeLabel(
  text: string,
  x: number,
  y: number,
  theme: ResolvedTheme
): string {
  return renderSimpleText(text, x, y, theme, { size: 11 });
}
