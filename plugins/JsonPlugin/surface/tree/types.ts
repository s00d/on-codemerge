import type { JsonNodeMenuTarget } from '../../components/JsonNodeMenu';

export type TreeHandlers = {
  select(path: number[]): void;
  runGuarded(fn: () => void): void;
  setValue(path: number[], value: unknown): void;
  rename(path: number[], key: string): void;
  insertProperty(objectPath: number[]): void;
  insertItem(arrayPath: number[]): void;
  deleteAt(path: number[]): void;
  duplicateAt(path: number[]): void;
  toggleCollapse(path: number[], alt: boolean): void;
  openMenu(target: JsonNodeMenuTarget, x: number, y: number): void;
  collapsed: Set<string>;
  selected: number[];
};

export function pathsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function pathKey(path: number[]): string {
  return path.join('.');
}

export function isInteractiveTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && Boolean(el.closest('[data-ocm-json-interactive]'));
}

export { typeLabel } from '../../drivers';
