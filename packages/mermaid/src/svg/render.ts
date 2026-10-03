import { labelLines } from '../layout/text';
import type { PositionedGraph, RenderOptions, ResolvedTheme, SequenceEndMarker } from '../types';
import { ACTOR_SWATCHES, NOTE_SWATCH, resolveTheme } from '../theme';
import { escapeXml } from './escape';
import { renderEdge, renderMarkers } from './edges';
import { renderCenteredText, renderSimpleText } from './labels';
import { renderNode } from './shapes';

function themePalette(theme: ResolvedTheme): string[] {
  return [theme.accent, ...ACTOR_SWATCHES.map((s) => s.stroke), theme.line, theme.fg];
}

function resolvePalette(options: RenderOptions, theme: ResolvedTheme): string[] {
  const custom = options.palette?.filter((c) => typeof c === 'string' && c.trim() !== '');
  if (custom !== undefined && custom.length > 0) {
    return custom;
  }
  return themePalette(theme);
}

function renderPie(graph: PositionedGraph, theme: ResolvedTheme, colors: string[]): string {
  const pie = graph.pie;
  if (pie === undefined) {
    return '';
  }
  const { cx, cy, r, hole, showData } = pie;
  const inner = r * hole;
  const parts: string[] = [];
  for (let i = 0; i < pie.slices.length; i += 1) {
    const s = pie.slices[i];
    if (s === undefined) {
      continue;
    }
    const end = s.start + s.sweep;
    const x1 = cx + Math.cos(s.start) * r;
    const y1 = cy + Math.sin(s.start) * r;
    const x2 = cx + Math.cos(end) * r;
    const y2 = cy + Math.sin(end) * r;
    const large = s.sweep > Math.PI ? 1 : 0;
    const color = colors[i % colors.length] ?? theme.accent;
    if (inner > 0.5) {
      const ix1 = cx + Math.cos(s.start) * inner;
      const iy1 = cy + Math.sin(s.start) * inner;
      const ix2 = cx + Math.cos(end) * inner;
      const iy2 = cy + Math.sin(end) * inner;
      parts.push(
        `<path d="M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 ${large} 0 ${ix1},${iy1} Z" fill="${escapeXml(color)}" stroke="${escapeXml(theme.bg)}" stroke-width="1"/>`
      );
    } else {
      parts.push(
        `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${escapeXml(color)}" stroke="${escapeXml(theme.bg)}" stroke-width="1"/>`
      );
    }
    const mid = s.start + s.sweep / 2;
    const labelR = inner > 0.5 ? (inner + r) / 2 : r * 0.62;
    const lx = cx + Math.cos(mid) * labelR;
    const ly = cy + Math.sin(mid) * labelR;
    const text = showData ? `${s.label} ${s.value}` : s.label;
    parts.push(renderSimpleText(text, lx, ly, theme, { size: 11, fill: theme.bg }));
  }
  return parts.join('');
}

function renderXy(graph: PositionedGraph, theme: ResolvedTheme, colors: string[]): string {
  const xy = graph.xychart;
  if (xy === undefined) {
    return '';
  }
  const { plotX, plotY, plotW, plotH, categories, yMin, yMax, series } = xy;
  const parts: string[] = [
    `<rect x="${plotX}" y="${plotY}" width="${plotW}" height="${plotH}" fill="none" stroke="${escapeXml(theme.border)}" stroke-width="1"/>`,
  ];
  for (let g = 1; g <= 4; g += 1) {
    const gy = plotY + (plotH * g) / 4;
    parts.push(
      `<line x1="${plotX}" y1="${gy}" x2="${plotX + plotW}" y2="${gy}" stroke="${escapeXml(theme.line)}" stroke-width="0.5" opacity="0.5"/>`
    );
  }
  const n = Math.max(categories.length, 1);
  const groupW = plotW / n;
  const barSeries = series.filter((s) => s.kind === 'bar');
  const barCount = Math.max(barSeries.length, 1);

  for (let si = 0; si < series.length; si += 1) {
    const s = series[si];
    if (s === undefined) {
      continue;
    }
    const color = colors[si % colors.length] ?? theme.accent;
    if (s.kind === 'bar') {
      const bi = barSeries.indexOf(s);
      for (let i = 0; i < n; i += 1) {
        const v = s.values[i] ?? 0;
        const h = ((v - yMin) / (yMax - yMin)) * plotH;
        const bw = (groupW * 0.7) / barCount;
        const x = plotX + i * groupW + groupW * 0.15 + bi * bw;
        const y = plotY + plotH - h;
        const fill =
          barCount === 1 && colors.length > 1 ? (colors[i % colors.length] ?? color) : color;
        parts.push(
          `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(0, h)}" fill="${escapeXml(fill)}"/>`
        );
      }
    } else {
      const xs: number[] = [];
      const ys: number[] = [];
      const ptStrs: string[] = [];
      for (let i = 0; i < n; i += 1) {
        const v = s.values[i] ?? 0;
        const x = plotX + i * groupW + groupW / 2;
        const y = plotY + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
        xs.push(x);
        ys.push(y);
        ptStrs.push(`${x},${y}`);
      }
      if (s.kind === 'area' && ptStrs.length > 0) {
        const first = xs[0] ?? plotX;
        const last = xs[xs.length - 1] ?? plotX + plotW;
        parts.push(
          `<path d="M${first},${plotY + plotH} L${ptStrs.join(' L')} L${last},${plotY + plotH} Z" fill="${escapeXml(color)}" opacity="0.35"/>`
        );
      }
      if (ptStrs.length > 0) {
        parts.push(
          `<path d="M${ptStrs.join(' L')}" fill="none" stroke="${escapeXml(color)}" stroke-width="2"/>`
        );
      }
    }
  }

  for (let i = 0; i < categories.length; i += 1) {
    const label = categories[i] ?? '';
    const x = plotX + i * groupW + groupW / 2;
    parts.push(renderSimpleText(label, x, plotY + plotH + 14, theme, { size: 10 }));
  }
  parts.push(
    renderSimpleText(String(yMax), plotX - 4, plotY + 4, theme, { size: 10, anchor: 'end' }),
    renderSimpleText(String(yMin), plotX - 4, plotY + plotH, theme, { size: 10, anchor: 'end' })
  );

  let legendX = plotX;
  const legendY = plotY + plotH + 32;
  for (let si = 0; si < series.length; si += 1) {
    const s = series[si];
    if (s?.name === undefined || s.name === '') {
      continue;
    }
    const color = colors[si % colors.length] ?? theme.accent;
    parts.push(
      `<rect x="${legendX}" y="${legendY - 8}" width="10" height="10" fill="${escapeXml(color)}"/>`,
      renderSimpleText(s.name, legendX + 16, legendY, theme, { size: 10, anchor: 'start' })
    );
    legendX += 16 + s.name.length * 7 + 12;
  }
  return parts.join('');
}

function renderRadar(graph: PositionedGraph, theme: ResolvedTheme, colors: string[]): string {
  const rad = graph.radar;
  if (rad === undefined) {
    return '';
  }
  const { cx, cy, r, axes, curves, min, max, ticks, showLegend } = rad;
  const n = Math.max(axes.length, 3);
  const parts: string[] = [];

  for (let t = 1; t <= ticks; t += 1) {
    const rr = (r * t) / ticks;
    const pts: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
    }
    parts.push(
      `<polygon points="${pts.join(' ')}" fill="none" stroke="${escapeXml(theme.line)}" stroke-width="0.75" opacity="0.6"/>`
    );
  }
  for (let i = 0; i < n; i += 1) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    parts.push(
      `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${escapeXml(theme.line)}" stroke-width="0.75"/>`
    );
    const axis = axes[i];
    const lx = cx + Math.cos(a) * (r + 16);
    const ly = cy + Math.sin(a) * (r + 16);
    parts.push(renderSimpleText(axis?.label ?? axis?.id ?? String(i), lx, ly, theme, { size: 10 }));
  }

  for (let ci = 0; ci < curves.length; ci += 1) {
    const c = curves[ci];
    if (c === undefined) {
      continue;
    }
    const color = colors[ci % colors.length] ?? theme.accent;
    const pts: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const v = c.values[i] ?? min;
      const t = (v - min) / (max - min);
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      pts.push(`${cx + Math.cos(a) * r * t},${cy + Math.sin(a) * r * t}`);
    }
    parts.push(
      `<polygon points="${pts.join(' ')}" fill="${escapeXml(color)}" opacity="0.25" stroke="${escapeXml(color)}" stroke-width="1.5"/>`
    );
  }

  if (showLegend) {
    let lx = cx - r;
    const ly = cy + r + 20;
    for (let ci = 0; ci < curves.length; ci += 1) {
      const c = curves[ci];
      if (c === undefined) {
        continue;
      }
      const color = colors[ci % colors.length] ?? theme.accent;
      const name = c.name ?? c.id;
      parts.push(
        `<rect x="${lx}" y="${ly - 8}" width="10" height="10" fill="${escapeXml(color)}"/>`,
        renderSimpleText(name, lx + 16, ly, theme, { size: 10, anchor: 'start' })
      );
      lx += 16 + name.length * 7 + 12;
    }
  }
  return parts.join('');
}

function markerUrl(end: SequenceEndMarker): string {
  if (end === 'open') {
    return 'url(#ocm-arrow-open)';
  }
  if (end === 'cross') {
    return 'url(#ocm-cross)';
  }
  return 'url(#ocm-arrow)';
}

function bareActorId(id: string): string {
  return id.endsWith('__bottom') ? id.slice(0, -8) : id;
}

function renderSequence(graph: PositionedGraph, theme: ResolvedTheme): string {
  const actorIdx = new Map<string, number>();
  for (let i = 0; i < graph.nodes.length; i += 1) {
    const n = graph.nodes[i];
    if (n !== undefined) {
      actorIdx.set(n.id, i);
    }
  }
  const parts: string[] = [];
  for (const ll of graph.lifelines ?? []) {
    parts.push(
      `<line x1="${ll.x}" y1="${ll.y1}" x2="${ll.x}" y2="${ll.y2}" stroke="${escapeXml(theme.line)}" stroke-width="1" stroke-dasharray="4 4" data-ocm-lifeline="1"/>`
    );
  }
  const messages = graph.sequenceMessages;
  if (messages !== undefined && messages.length > 0) {
    for (const msg of messages) {
      const dash = msg.dashed ? ' stroke-dasharray="4 3"' : '';
      parts.push(
        `<path d="M${msg.x1},${msg.y} L${msg.x2},${msg.y}" fill="none" stroke="${escapeXml(theme.line)}" stroke-width="1.5"${dash} marker-end="${markerUrl(msg.end)}" data-ocm-seq-msg="1"/>`
      );
      const midX = (msg.x1 + msg.x2) / 2;
      const firstLine = labelLines(msg.label)[0] ?? '';
      if (firstLine !== '') {
        parts.push(renderSimpleText(firstLine, midX, msg.y - 6, theme, { size: 11 }));
      }
    }
  } else {
    for (const e of graph.edges) {
      parts.push(renderEdge(e, theme));
    }
  }
  for (const note of graph.sequenceNotes ?? []) {
    parts.push(
      `<rect x="${note.x}" y="${note.y}" width="${note.width}" height="${note.height}" rx="4" ry="4" fill="${escapeXml(NOTE_SWATCH.fill)}" stroke="${escapeXml(NOTE_SWATCH.stroke)}" stroke-width="1" data-ocm-seq-note="1"/>`,
      renderCenteredText(note.label, note.x + note.width / 2, note.y + note.height / 2, theme, 11)
    );
  }
  const renderActor = (node: PositionedGraph['nodes'][number], end: 'top' | 'bottom'): void => {
    const bare = bareActorId(node.id);
    const idx = actorIdx.get(bare) ?? 0;
    const swatch = ACTOR_SWATCHES[idx % ACTOR_SWATCHES.length] ?? ACTOR_SWATCHES[0];
    const inner = renderNode(node, theme, swatch ?? ACTOR_SWATCHES[0]);
    parts.push(`<g data-ocm-seq-actor="${end}" data-actor-id="${escapeXml(bare)}">${inner}</g>`);
  };
  for (const n of graph.nodes) {
    renderActor(n, 'top');
  }
  for (const n of graph.sequenceActorBottoms ?? []) {
    renderActor(n, 'bottom');
  }
  return parts.join('');
}

function renderFlowChrome(graph: PositionedGraph, theme: ResolvedTheme): string {
  const chrome = { fill: theme.surface, stroke: theme.accent };
  const parts: string[] = [];
  for (const e of graph.edges) {
    parts.push(renderEdge(e, theme));
  }
  for (const n of graph.nodes) {
    parts.push(`<g filter="url(#ocm-node-shadow)">${renderNode(n, theme, chrome)}</g>`);
  }
  return parts.join('');
}

export function renderSvg(graph: PositionedGraph, options: RenderOptions = {}): string {
  const theme = resolveTheme(options.theme);
  const colors = resolvePalette(options, theme);
  const padding = options.padding ?? 0;
  const width = graph.width + padding * 2;
  const height = graph.height + padding * 2;
  const bg = options.transparent === true ? 'none' : theme.bg;

  const title =
    graph.title !== undefined && graph.title !== ''
      ? renderSimpleText(graph.title, width / 2, 18, theme, { size: 14, weight: '600' })
      : '';

  let body: string;
  if (graph.kind === 'pie') {
    body = renderPie(graph, theme, colors);
  } else if (graph.kind === 'xychart') {
    body = renderXy(graph, theme, colors);
  } else if (graph.kind === 'radar') {
    body = renderRadar(graph, theme, colors);
  } else if (graph.kind === 'sequence') {
    body = renderSequence(graph, theme);
  } else {
    body = renderFlowChrome(graph, theme);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" data-ocm-mermaid="1"><rect width="${width}" height="${height}" fill="${escapeXml(bg)}"/>${renderMarkers(theme)}${title}<g transform="translate(${padding},${padding})">${body}</g></svg>`;
}
