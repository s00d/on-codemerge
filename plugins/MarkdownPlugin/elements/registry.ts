import { BUILTIN_MD_ELEMENTS } from './builtins';
import type { MdCustomElement, MdElementRegistry } from './types';

export function createMdElementRegistry(extra: MdCustomElement[] = []): MdElementRegistry {
  const map = new Map<string, MdCustomElement>();
  for (const el of [...BUILTIN_MD_ELEMENTS, ...extra]) {
    const id = el.id.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) {
      continue;
    }
    map.set(id, { ...el, id });
  }
  return {
    get: (id) => map.get(id.trim().toLowerCase()),
    list: () =>
      [...map.values()].toSorted(
        (a, b) => (a.order ?? 100) - (b.order ?? 100) || a.id.localeCompare(b.id)
      ),
    ids: () => [...map.keys()],
  };
}

/** Default registry (info / warn / error). */
export const defaultMdElementRegistry = createMdElementRegistry();
