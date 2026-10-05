import type { Command, DocNode } from '@codemerge/kernel';

/** Resolve JSON doc path from a mounted atom widget DOM node. */
export function pathFromEl(el: Element | null): number[] | null {
  if (!el || !(el instanceof HTMLElement)) {
    return null;
  }
  const pathRaw =
    el.dataset.ocmPath ??
    el.dataset.ocmBlock ??
    el.closest<HTMLElement>('[data-ocm-path]')?.dataset.ocmPath ??
    el.closest<HTMLElement>('[data-ocm-block]')?.dataset.ocmBlock;
  if (pathRaw === undefined || pathRaw === null || pathRaw === '') {
    return null;
  }
  return pathRaw.includes('.') ? pathRaw.split('.').map(Number) : [Number(pathRaw)];
}

export function nodeAtPath(doc: DocNode, path: number[] | null): DocNode | null {
  if (!path) {
    return null;
  }
  let node: DocNode = doc;
  for (const index of path) {
    const child = node.content?.[index];
    if (!child) {
      return null;
    }
    node = child;
  }
  return node;
}

/**
 * Find mounted atom hosts for a node type.
 * Matches CE shell (`data-ocm-atom` + `data-type` / `data-ocm-type`) and plugin
 * wrapper classes (`ocm-<type>-atom`) used by Timer/Calendar/Form mounts.
 */
export function queryAtomHosts(root: ParentNode, type: string): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const out: HTMLElement[] = [];
  const add = (el: Element): void => {
    if (!(el instanceof HTMLElement)) {
      return;
    }
    const shell = el.matches('[data-ocm-atom="1"]')
      ? el
      : (el.closest<HTMLElement>('[data-ocm-atom="1"]') ?? el);
    if (seen.has(shell)) {
      return;
    }
    seen.add(shell);
    out.push(shell);
  };
  const safe = CSS.escape(type);
  root.querySelectorAll(`[data-ocm-atom="1"][data-type="${safe}"]`).forEach(add);
  root.querySelectorAll(`[data-ocm-type="${safe}"]`).forEach(add);
  root.querySelectorAll(`.ocm-${safe}-atom`).forEach(add);
  return out;
}

/** Remove top-level atom by DOM node or doc path. */
export function removeAtomAt(
  target: Element | number[] | null | undefined,
  run: (cmd: Command) => boolean
): void {
  const path = Array.isArray(target) ? target : pathFromEl(target ?? null);
  if (!path || path.length === 0) {
    return;
  }
  const index = path[0];
  if (typeof index !== 'number' || Number.isNaN(index)) {
    return;
  }
  run((_state) => [{ type: 'remove_node', path: [], index }]);
}
