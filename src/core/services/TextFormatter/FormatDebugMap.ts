export type FormatDebugAction = 'apply' | 'remove' | 'noop';

export interface NodePoint {
  path: string;
  offset: number;
  nodeType: string;
}

export interface DomTreeEntry {
  path: string;
  nodeType: string;
  label: string;
  textPreview?: string;
}

export interface NodeRef {
  path: string;
  tag: string;
  classes: string[];
}

export interface PipelineStep {
  step: string;
  input?: unknown;
  output?: unknown;
  decision?: string;
}

export interface FormatDebugSelection {
  collapsed: boolean;
  text: string;
  start: NodePoint;
  end: NodePoint;
  commonAncestorPath: string;
}

export interface FormatDebugMap {
  id: string;
  command: string;
  htmlBefore: string;
  htmlAfter: string;
  selection: FormatDebugSelection;
  domTree: DomTreeEntry[];
  pipeline: PipelineStep[];
  nodesToModify: NodeRef[];
  action: FormatDebugAction;
}

const pathMap = new WeakMap<Node, string>();

export function clearNodePathCache(): void {
  // WeakMap clears automatically when nodes are GC'd; new roots need fresh build
}

export function buildDomTree(container: HTMLElement): DomTreeEntry[] {
  const entries: DomTreeEntry[] = [];

  const walk = (node: Node, path: string) => {
    pathMap.set(node, path);

    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).textContent ?? '';
      entries.push({
        path,
        nodeType: '#text',
        label: '#text',
        textPreview: text.length > 40 ? `${text.slice(0, 40)}…` : text,
      });
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const classes =
        el.classList.length > 0 ? `.${Array.from(el.classList).join('.')}` : '';
      entries.push({
        path,
        nodeType: el.tagName,
        label: `${el.tagName.toLowerCase()}${classes}`,
      });

      Array.from(node.childNodes).forEach((child, index) => {
        walk(child, path ? `${path}/${index}` : `${index}`);
      });
    }
  };

  Array.from(container.childNodes).forEach((child, index) => {
    walk(child, `${index}`);
  });

  return entries;
}

export function getNodePath(node: Node, container: HTMLElement): string {
  const cached = pathMap.get(node);
  if (cached) return cached;

  const parts: number[] = [];
  let current: Node | null = node;

  while (current && current !== container) {
    const parent = current.parentNode;
    if (!parent) break;
    const index = Array.from(parent.childNodes).indexOf(current as ChildNode);
    parts.unshift(index);
    current = parent;
  }

  return parts.join('/');
}

export function describeNode(node: Node): { nodeType: string; label: string } {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node as Text).textContent ?? '';
    const preview = text.length > 20 ? `${text.slice(0, 20)}…` : text;
    return { nodeType: '#text', label: `"${preview}"` };
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const classes =
      el.classList.length > 0 ? `.${Array.from(el.classList).join('.')}` : '';
    return { nodeType: el.tagName, label: `${el.tagName.toLowerCase()}${classes}` };
  }
  return { nodeType: String(node.nodeType), label: node.nodeName };
}

export function serializeSelection(
  selection: Selection,
  container: HTMLElement
): FormatDebugSelection {
  const range = selection.getRangeAt(0);
  return {
    collapsed: range.collapsed,
    text: range.toString(),
    start: {
      path: getNodePath(range.startContainer, container),
      offset: range.startOffset,
      nodeType: describeNode(range.startContainer).nodeType,
    },
    end: {
      path: getNodePath(range.endContainer, container),
      offset: range.endOffset,
      nodeType: describeNode(range.endContainer).nodeType,
    },
    commonAncestorPath: getNodePath(range.commonAncestorContainer, container),
  };
}

export function nodeToRef(node: Node, container: HTMLElement): NodeRef {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    return {
      path: getNodePath(node, container),
      tag: el.tagName,
      classes: Array.from(el.classList),
    };
  }
  return {
    path: getNodePath(node, container),
    tag: '#text',
    classes: [],
  };
}

export function formatDebugMapToString(map: FormatDebugMap): string {
  const lines: string[] = [
    '── Format Debug Map ──',
    `ID: ${map.id}`,
    `Command: ${map.command} | Action: ${map.action}`,
    `Selection: "${map.selection.text}" [collapsed=${map.selection.collapsed}]`,
    `  start: ${map.selection.start.path} offset ${map.selection.start.offset} (${map.selection.start.nodeType})`,
    `  end:   ${map.selection.end.path} offset ${map.selection.end.offset} (${map.selection.end.nodeType})`,
    `  commonAncestor: ${map.selection.commonAncestorPath}`,
    '',
    'DOM Tree:',
  ];

  map.domTree.forEach((entry) => {
    const indent = '  '.repeat(entry.path.split('/').length);
    const preview = entry.textPreview ? ` "${entry.textPreview}"` : '';
    lines.push(`${indent}${entry.path}  ${entry.label}${preview}`);
  });

  lines.push('', 'Pipeline:');
  map.pipeline.forEach((step, index) => {
    const decision = step.decision ? ` (${step.decision})` : '';
    const output =
      step.output !== undefined ? ` → ${JSON.stringify(step.output)}` : '';
    lines.push(`  ${index + 1}. ${step.step}${decision}${output}`);
  });

  if (map.nodesToModify.length > 0) {
    lines.push('', 'Nodes to modify:');
    map.nodesToModify.forEach((node) => {
      const cls = node.classes.length ? `.${node.classes.join('.')}` : '';
      lines.push(`  ${node.path}  ${node.tag}${cls}`);
    });
  }

  lines.push('', `HTML before: ${map.htmlBefore}`, `HTML after:  ${map.htmlAfter}`);

  return lines.join('\n');
}

declare global {
  interface Window {
    __ON_CODE_MERGE_FORMAT_DEBUG__?: FormatDebugMap;
  }
}

export function publishFormatDebugMap(map: FormatDebugMap): void {
  if (typeof window !== 'undefined') {
    window.__ON_CODE_MERGE_FORMAT_DEBUG__ = map;
  }
}

export function isFormatDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.location.search.includes('formatDebug=1')) return true;
    return localStorage.getItem('on-codemerge:format-debug') === '1';
  } catch {
    return false;
  }
}
