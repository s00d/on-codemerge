import {
  eqIgnoreCase,
  forEachLine,
  restTrim,
  skipWs,
  startsWithWord,
  takeArrow,
  takeId,
} from '../scan';
import type {
  Direction,
  FlowEdge,
  FlowNode,
  FlowchartIR,
  NodeShape,
  ParseDiagnostic,
} from '../types';
import { normalizeLabel } from './label';

interface Consume {
  id: string;
  rest: string;
}

function shapeOf(open: string): NodeShape {
  if (open === '[') {
    return 'rect';
  }
  if (open === '(') {
    return 'rounded';
  }
  if (open === '{') {
    return 'diamond';
  }
  return 'rect';
}

function registerNode(
  nodes: Map<string, FlowNode>,
  id: string,
  label: string,
  shape: NodeShape
): void {
  const prev = nodes.get(id);
  if (prev === undefined) {
    nodes.set(id, { id, label, shape });
    return;
  }
  // Later declaration wins (e.g. bare `e` then `e((Circle))`).
  if (label !== id || shape !== 'rect' || prev.label === prev.id) {
    prev.label = label;
    prev.shape = shape;
  }
}

function consumeNode(text: string, nodes: Map<string, FlowNode>, asState: boolean): Consume | null {
  let i = skipWs(text, 0);

  if (asState && text.startsWith('[*]', i)) {
    const id = '_start';
    if (!nodes.has(id)) {
      nodes.set(id, { id, label: '', shape: 'start' });
    }
    return { id, rest: text.slice(i + 3) };
  }

  const idTok = takeId(text, i);
  if (idTok === null) {
    return null;
  }
  const id = idTok.value;
  let rest = text.slice(idTok.next);
  let label = id;
  let shape: NodeShape = 'rect';

  if (rest.startsWith('((')) {
    const end = rest.indexOf('))', 2);
    if (end !== -1) {
      label = normalizeLabel(rest.slice(2, end));
      shape = 'circle';
      rest = rest.slice(end + 2);
    }
  } else if (rest.startsWith('([') && rest.includes('])')) {
    const end = rest.indexOf('])', 2);
    if (end !== -1) {
      label = normalizeLabel(rest.slice(2, end));
      shape = 'stadium';
      rest = rest.slice(end + 2);
    }
  } else if (rest.startsWith('[(') && rest.includes(')]')) {
    const end = rest.indexOf(')]', 2);
    if (end !== -1) {
      label = normalizeLabel(rest.slice(2, end));
      shape = 'cyl';
      rest = rest.slice(end + 2);
    }
  } else if (rest.startsWith('>') && rest.includes(']')) {
    // Asymmetric / odd shape: id>Label]
    const end = rest.indexOf(']', 1);
    if (end !== -1) {
      label = normalizeLabel(rest.slice(1, end));
      shape = 'odd';
      rest = rest.slice(end + 1);
    }
  } else if (rest.startsWith('[') || rest.startsWith('(') || rest.startsWith('{')) {
    const open = rest[0] ?? '[';
    const close = open === '[' ? ']' : open === '{' ? '}' : ')';
    const end = rest.indexOf(close, 1);
    if (end !== -1) {
      label = normalizeLabel(rest.slice(1, end));
      shape = shapeOf(open);
      rest = rest.slice(end + 1);
    }
  }

  registerNode(nodes, id, label, shape);
  return { id, rest };
}

function consumeTarget(
  text: string,
  nodes: Map<string, FlowNode>,
  asState: boolean
): Consume | null {
  let i = skipWs(text, 0);
  if (asState && text.startsWith('[*]', i)) {
    const id = '_end';
    if (!nodes.has(id)) {
      nodes.set(id, { id, label: '', shape: 'end' });
    }
    return { id, rest: text.slice(i + 3) };
  }
  return consumeNode(text, nodes, asState);
}

function parseDirection(header: string): Direction {
  const dirs = ['TD', 'TB', 'LR', 'BT', 'RL'] as const;
  const upper = header.toUpperCase();
  for (const d of dirs) {
    const idx = upper.indexOf(` ${d}`);
    if (idx !== -1) {
      const after = idx + 1 + d.length;
      if (after >= upper.length || upper.charCodeAt(after) === 32) {
        return d;
      }
    }
  }
  for (const d of dirs) {
    if (
      upper.endsWith(d) &&
      (upper.length === d.length || upper[upper.length - d.length - 1] === ' ')
    ) {
      return d;
    }
  }
  return 'TD';
}

/** `-- label -->` or `-. label .->` (label may contain spaces / br). */
function takeLabeledArrow(
  rest: string
): { label: string; dashed: boolean; thick: boolean; next: number } | null {
  const s = restTrim(rest, 0);
  if (s.startsWith('-.') && !s.startsWith('-.->')) {
    const end = s.indexOf('.->');
    if (end !== -1) {
      return {
        label: normalizeLabel(s.slice(2, end).trim()),
        dashed: true,
        thick: false,
        next: end + 3,
      };
    }
  }
  if (s.startsWith('--') && !s.startsWith('-->') && !s.startsWith('-->>') && !s.startsWith('--x')) {
    const end = s.indexOf('-->');
    if (end !== -1) {
      return {
        label: normalizeLabel(s.slice(2, end).trim()),
        dashed: false,
        thick: false,
        next: end + 3,
      };
    }
  }
  return null;
}

function parseEdgeLine(
  line: string,
  nodes: Map<string, FlowNode>,
  edges: FlowEdge[],
  diagnostics: ParseDiagnostic[],
  asState: boolean
): void {
  let from = consumeNode(line, nodes, asState);
  if (from === null) {
    diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
    return;
  }
  let rest = restTrim(from.rest, 0);
  let edgesAdded = 0;
  while (true) {
    let dashed = false;
    let thick = false;
    let edgeLabel: string | undefined;

    const labeled = takeLabeledArrow(rest);
    if (labeled !== null) {
      edgeLabel = labeled.label === '' ? undefined : labeled.label;
      dashed = labeled.dashed;
      thick = labeled.thick;
      rest = restTrim(rest, labeled.next);
    } else {
      const arrow = takeArrow(rest, 0);
      if (arrow === null) {
        break;
      }
      dashed = arrow.value.includes('.');
      thick = arrow.value.startsWith('==');
      rest = restTrim(rest, arrow.next);
      if (rest.startsWith('|')) {
        const end = rest.indexOf('|', 1);
        if (end !== -1) {
          edgeLabel = normalizeLabel(rest.slice(1, end));
          rest = restTrim(rest, end + 1);
        }
      }
    }

    const to = consumeTarget(rest, nodes, asState);
    if (to === null) {
      diagnostics.push({ severity: 'warning', message: `Missing target on: ${line}` });
      return;
    }
    if (asState && from.id === '_start') {
      const n = nodes.get('_start');
      if (n !== undefined) {
        n.shape = 'start';
        n.label = '';
      }
    }
    edges.push({
      from: from.id,
      to: to.id,
      label: edgeLabel,
      dashed,
      thick,
    });
    edgesAdded += 1;
    from = to;
    rest = restTrim(to.rest, 0);
  }
  if (edgesAdded === 0 && rest !== '') {
    // lone node declaration — already registered
  }
}

function splitLines(source: string): string[] {
  const out: string[] = [];
  forEachLine(
    source,
    (line) => {
      if (!line.startsWith('%%')) {
        out.push(line);
      }
    },
    { semicolon: true }
  );
  return out;
}

function shouldSkipLine(line: string): boolean {
  if (eqIgnoreCase(line, 'end')) {
    return true;
  }
  if (startsWithWord(line, 'subgraph')) {
    return true;
  }
  if (startsWithWord(line, 'classDef')) {
    return true;
  }
  if (startsWithWord(line, 'class')) {
    return true;
  }
  if (startsWithWord(line, 'style')) {
    return true;
  }
  if (startsWithWord(line, 'linkStyle')) {
    return true;
  }
  if (startsWithWord(line, 'click')) {
    return true;
  }
  return false;
}

export function parseFlowchart(
  source: string,
  asState = false
): { ir: FlowchartIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const lines = splitLines(source);

  if (lines.length === 0) {
    return {
      ir: { type: 'flowchart', direction: 'TD', nodes: [], edges: [] },
      diagnostics: [{ severity: 'error', message: 'Empty diagram' }],
    };
  }

  let direction: Direction = 'TD';
  let start = 0;
  const header = lines[0] ?? '';
  const h = header.toLowerCase();
  if (h.startsWith('graph') || h.startsWith('flowchart') || h.startsWith('statediagram')) {
    direction = parseDirection(header);
    start = 1;
  }

  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }
    if (!asState && shouldSkipLine(line)) {
      continue;
    }
    parseEdgeLine(line, nodes, edges, diagnostics, asState);
  }

  if (asState) {
    for (const [id, node] of nodes) {
      if (id === '_start') {
        node.shape = 'start';
        node.label = '';
      }
      if (id === '_end') {
        node.shape = 'end';
        node.label = '';
      }
    }
  }

  return {
    ir: {
      type: 'flowchart',
      direction,
      nodes: [...nodes.values()],
      edges,
    },
    diagnostics,
  };
}
