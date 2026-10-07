import { createEditorHost } from '@codemerge/integrate';
import type { EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

const DATA_KEY = '__ocmIntegrateHost';
type ElWithHost = HTMLElement & { [DATA_KEY]?: EditorHostHandle };

/** Register `$.fn.ocmEditor(options)`. Pass the host app's `$`. */
export function registerJQueryPlugin($: { fn: Record<string, unknown> }): void {
  $.fn.ocmEditor = function (
    this: { each: (fn: (i: number, el: HTMLElement) => void) => unknown },
    options: HostOptions = {}
  ) {
    return this.each((_i, el) => {
      const node = el as ElWithHost;
      node[DATA_KEY]?.destroy();
      node[DATA_KEY] = createEditorHost(node, options);
    });
  };
}

export { createEditorHost, mountCodeMergeEditor } from '@codemerge/integrate';
