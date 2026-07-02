import {
  buildDomTree,
  type FormatDebugAction,
  type FormatDebugMap,
  type NodeRef,
  type PipelineStep,
  nodeToRef,
  publishFormatDebugMap,
  serializeSelection,
} from './FormatDebugMap';

let traceCounter = 0;

export class FormatDebugTracer {
  private enabled = false;
  private current: Partial<FormatDebugMap> | null = null;
  private lastMap: FormatDebugMap | null = null;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getLastMap(): FormatDebugMap | null {
    return this.lastMap;
  }

  begin(command: string, container: HTMLElement, selection: Selection): void {
    if (!this.enabled) return;

    buildDomTree(container);
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    this.current = {
      id: `trace-${++traceCounter}`,
      command,
      htmlBefore: container.innerHTML,
      selection: range
        ? serializeSelection(selection, container)
        : {
            collapsed: true,
            text: '',
            start: { path: '', offset: 0, nodeType: 'none' },
            end: { path: '', offset: 0, nodeType: 'none' },
            commonAncestorPath: '',
          },
      domTree: buildDomTree(container),
      pipeline: [],
      nodesToModify: [],
      action: 'noop',
    };
  }

  step(
    step: string,
    output?: unknown,
    decision?: string,
    input?: unknown
  ): void {
    if (!this.enabled || !this.current) return;

    const entry: PipelineStep = { step };
    if (input !== undefined) entry.input = input;
    if (output !== undefined) entry.output = output;
    if (decision) entry.decision = decision;

    this.current.pipeline!.push(entry);
  }

  setNodesToModify(nodes: Node[], container: HTMLElement): void {
    if (!this.enabled || !this.current) return;
    this.current.nodesToModify = nodes.map((n) => nodeToRef(n, container));
  }

  setAction(action: FormatDebugAction): void {
    if (!this.enabled || !this.current) return;
    this.current.action = action;
  }

  end(container: HTMLElement): FormatDebugMap | null {
    if (!this.enabled || !this.current) return null;

    buildDomTree(container);
    const map: FormatDebugMap = {
      id: this.current.id!,
      command: this.current.command!,
      htmlBefore: this.current.htmlBefore!,
      htmlAfter: container.innerHTML,
      selection: this.current.selection!,
      domTree: buildDomTree(container),
      pipeline: this.current.pipeline ?? [],
      nodesToModify: this.current.nodesToModify ?? [],
      action: this.current.action ?? 'noop',
    };

    this.lastMap = map;
    this.current = null;
    publishFormatDebugMap(map);

    return map;
  }

  logToConsole(map: FormatDebugMap, formatter: (m: FormatDebugMap) => string): void {
    if (!this.enabled) return;
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) return;
    console.info(formatter(map));
  }
}
