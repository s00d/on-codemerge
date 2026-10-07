import { createEditorHost } from '@codemerge/integrate';
import type { EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

export const browser = typeof document !== 'undefined';

/** Mount only in the browser (SvelteKit). */
export function mountCodeMergeEditor(
  el: HTMLElement,
  options: HostOptions = {}
): EditorHostHandle | null {
  if (!browser) {
    return null;
  }
  return createEditorHost(el, options);
}
