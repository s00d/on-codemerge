import { createEditorHost } from '@codemerge/integrate';
import type { ChromeMode, DocFormat, EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

type Vue2This = {
  $refs: { host?: HTMLElement };
  $emit: (e: string, ...args: unknown[]) => void;
  value: string;
  format: DocFormat;
  chrome: ChromeMode;
  hostOptions: HostOptions | undefined;
  _ocmHandle: EditorHostHandle | null;
};

function asHostOptions(value: unknown): HostOptions {
  return typeof value === 'object' && value !== null ? { ...value } : {};
}

/** Vue 2 Options API component (peer `vue@^2.7`). */
export const CodeMergeEditor = {
  name: 'CodeMergeEditor',
  props: {
    value: { type: String, default: '' },
    format: { type: String, default: 'html' },
    chrome: { type: String, default: 'bar' },
    hostOptions: { type: Object, default: undefined },
    minHeight: { type: [Number, String], default: 300 },
  },
  data() {
    return { _ocmHandle: null as EditorHostHandle | null };
  },
  watch: {
    value(this: Vue2This, v: string) {
      this._ocmHandle?.setValue(v);
    },
  },
  mounted(this: Vue2This) {
    const el = this.$refs.host;
    if (!el) {
      return;
    }
    this._ocmHandle = createEditorHost(el, {
      ...asHostOptions(this.hostOptions),
      value: this.value,
      format: this.format,
      chrome: this.chrome,
      onChange: (value, format) => this.$emit('change', value, format),
      onReady: (h) => this.$emit('ready', h),
    });
  },
  beforeDestroy(this: Vue2This) {
    this._ocmHandle?.destroy();
    this._ocmHandle = null;
  },
  beforeUnmount(this: Vue2This) {
    this._ocmHandle?.destroy();
    this._ocmHandle = null;
  },
  template: '<div ref="host" :style="{ minHeight }"></div>',
};

export default CodeMergeEditor;
