import type { Command } from '@on-codemerge/kernel';

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
