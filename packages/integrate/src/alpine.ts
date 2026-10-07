import { createEditorHost } from '@codemerge/integrate';
import type { EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

/** Register Alpine data component `ocmEditor`. */
export function registerAlpine(Alpine: {
  data: (name: string, fn: (options?: HostOptions) => Record<string, unknown>) => void;
}): void {
  Alpine.data('ocmEditor', (options: HostOptions = {}) => {
    let handle: EditorHostHandle | null = null;
    return {
      init(this: { $el: HTMLElement; value: string }) {
        handle = createEditorHost(this.$el, {
          ...options,
          value: options.value ?? this.value,
          onChange: (v, f) => {
            this.value = v;
            options.onChange?.(v, f);
          },
        });
      },
      destroy() {
        handle?.destroy();
        handle = null;
      },
      value: options.value ?? '',
    };
  });
}

export { createEditorHost, mountCodeMergeEditor } from '@codemerge/integrate';
