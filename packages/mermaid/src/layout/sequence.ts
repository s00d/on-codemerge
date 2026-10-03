import type {
  LayoutOptions,
  PositionedGraph,
  PositionedLifeline,
  PositionedSequenceMessage,
  PositionedSequenceNote,
  SequenceArrow,
  SequenceEndMarker,
  SequenceIR,
} from '../types';
import { measureLabel } from './text';

function endFromArrow(arrow: SequenceArrow): SequenceEndMarker {
  if (arrow.endsWith('cross')) {
    return 'cross';
  }
  if (arrow.endsWith('open')) {
    return 'open';
  }
  return 'arrow';
}

export function layoutSequence(ir: SequenceIR, options: LayoutOptions): PositionedGraph {
  const padding = options.padding ?? 24;
  const colW = 140;
  const actorH = 36;
  const msgGap = 44;
  const noteGap = 12;

  const participants = ir.participants;
  const items = ir.items;

  const nodes = participants.map((p, i) => {
    const m = measureLabel(p.label, 64);
    const x = padding + i * colW + (colW - m.width) / 2;
    return {
      id: p.id,
      label: p.label,
      shape: 'rect' as const,
      x,
      y: padding,
      width: Math.max(m.width, 64),
      height: actorH,
    };
  });

  const colX = new Map<string, number>();
  for (let i = 0; i < participants.length; i += 1) {
    const p = participants[i];
    if (p === undefined) {
      continue;
    }
    colX.set(p.id, padding + i * colW + colW / 2);
  }

  const sequenceMessages: PositionedSequenceMessage[] = [];
  const sequenceNotes: PositionedSequenceNote[] = [];
  const edges: PositionedGraph['edges'] = [];

  let y = padding + actorH + 28;
  let minX = padding;
  let maxX = padding + Math.max(1, participants.length) * colW;

  for (const item of items) {
    if (item.kind === 'message') {
      const x1 = colX.get(item.from) ?? padding;
      const x2 = colX.get(item.to) ?? padding + colW;
      const end = endFromArrow(item.arrow);
      const dashed = item.dashed === true || item.arrow.startsWith('dotted');
      sequenceMessages.push({
        x1,
        x2,
        y,
        label: item.label,
        dashed,
        end,
      });
      edges.push({
        from: item.from,
        to: item.to,
        label: item.label,
        dashed,
        end,
        points: [
          { x: x1, y },
          { x: x2, y },
        ],
      });
      y += msgGap;
      continue;
    }

    const m = measureLabel(item.label, 80, 16, 12);
    const px = colX.get(item.participant) ?? padding;
    const noteW = m.width;
    const noteH = m.height;
    const nx = item.side === 'right' ? px + 16 : px - noteW - 16;
    sequenceNotes.push({
      x: nx,
      y: y - noteH / 2 + 4,
      width: noteW,
      height: noteH,
      label: item.label,
    });
    minX = Math.min(minX, nx);
    maxX = Math.max(maxX, nx + noteW);
    y += noteH + noteGap;
  }

  const yLineEnd = y + 16;
  const yTop = padding + actorH;
  const sequenceActorBottoms = nodes.map((n) => ({
    ...n,
    id: `${n.id}__bottom`,
    y: yLineEnd,
  }));
  const yBottom = yLineEnd + actorH;
  const lifelines: PositionedLifeline[] = participants.map((_, i) => ({
    x: padding + i * colW + colW / 2,
    y1: yTop,
    y2: yLineEnd,
  }));

  // Shift everything if notes went left of padding.
  const shift = minX < padding ? padding - minX : 0;
  if (shift > 0) {
    for (const n of nodes) {
      n.x += shift;
    }
    for (const n of sequenceActorBottoms) {
      n.x += shift;
    }
    for (const ll of lifelines) {
      ll.x += shift;
    }
    for (const msg of sequenceMessages) {
      msg.x1 += shift;
      msg.x2 += shift;
    }
    for (const note of sequenceNotes) {
      note.x += shift;
    }
    for (const e of edges) {
      for (const p of e.points) {
        p.x += shift;
      }
    }
    maxX += shift;
    minX = padding;
  }

  const width = Math.max(maxX, padding + participants.length * colW) + padding;
  const height = yBottom + padding;

  return {
    kind: 'sequence',
    width,
    height,
    nodes,
    edges,
    lifelines,
    sequenceMessages,
    sequenceNotes,
    sequenceActorBottoms,
  };
}
