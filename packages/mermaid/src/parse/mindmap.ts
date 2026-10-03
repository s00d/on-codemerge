import { eqIgnoreCase } from '../scan';
import type { MindNode, MindmapIR, ParseDiagnostic } from '../types';

function indentOf(line: string): number {
  let i = 0;
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
    i += 1;
  }
  return i;
}

function stripShape(label: string): string {
  let s = label.trim();
  if (s.startsWith('((') && s.endsWith('))')) {
    return s.slice(2, -2).trim();
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    return s.slice(1, -1).trim();
  }
  if (s.startsWith('(') && s.endsWith(')')) {
    return s.slice(1, -1).trim();
  }
  return s;
}

export function parseMindmap(source: string): { ir: MindmapIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  const lines = source.split('\n').filter((l) => {
    const t = l.trim();
    return t !== '' && !t.startsWith('%%') && !eqIgnoreCase(t, 'mindmap');
  });

  if (lines.length === 0) {
    return {
      ir: { type: 'mindmap', root: { id: 'root', label: 'root', children: [] } },
      diagnostics: [{ severity: 'error', message: 'Mindmap must have at least one root node' }],
    };
  }

  let idSeq = 0;
  const rootLine = lines[0] ?? '';
  const rootIndent = indentOf(rootLine);
  const root: MindNode = {
    id: `n${idSeq}`,
    label: stripShape(rootLine.trim()),
    children: [],
  };
  idSeq += 1;

  const stack: Array<{ indent: number; node: MindNode }> = [{ indent: rootIndent, node: root }];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }
    const indent = indentOf(line);
    const node: MindNode = {
      id: `n${idSeq}`,
      label: stripShape(line.trim()),
      children: [],
    };
    idSeq += 1;
    while (stack.length > 1 && (stack[stack.length - 1]?.indent ?? 0) >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1]?.node;
    if (parent === undefined) {
      diagnostics.push({ severity: 'warning', message: `Orphan mindmap node: ${line.trim()}` });
      continue;
    }
    parent.children.push(node);
    stack.push({ indent, node });
  }

  return { ir: { type: 'mindmap', root }, diagnostics };
}
