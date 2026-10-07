import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createEditorHost } from '@codemerge/integrate';
import type { ChromeMode, DocFormat, EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

function asFormat(value: string): DocFormat {
  return value === 'markdown' || value === 'text' || value === 'html' ? value : 'html';
}

function asChrome(value: string): ChromeMode {
  return value === 'page' || value === 'bar' ? value : 'bar';
}

function asHostOptions(value: unknown): HostOptions {
  return typeof value === 'object' && value !== null ? { ...value } : {};
}

export const CodeMergeEditor = defineComponent({
  name: 'CodeMergeEditor',
  props: {
    value: { type: String, default: '' },
    format: { type: String, default: 'html' },
    chrome: { type: String, default: 'bar' },
    hostOptions: { type: Object, default: undefined },
    minHeight: { type: [Number, String], default: 300 },
  },
  emits: {
    change: (_value: string, _format: DocFormat) => true,
    ready: (_host: EditorHostHandle) => true,
  },
  setup(props, { emit }) {
    const elRef = ref<HTMLElement | null>(null);
    let handle: EditorHostHandle | null = null;

    onMounted(() => {
      const el = elRef.value;
      if (!el) {
        return;
      }
      handle = createEditorHost(el, {
        ...asHostOptions(props.hostOptions),
        value: props.value,
        format: asFormat(props.format),
        chrome: asChrome(props.chrome),
        onChange: (value, format) => emit('change', value, format),
        onReady: (hnd) => emit('ready', hnd),
      });
    });

    watch(
      () => props.value,
      (v) => {
        handle?.setValue(v);
      }
    );

    onBeforeUnmount(() => {
      handle?.destroy();
      handle = null;
    });

    return () =>
      h('div', {
        ref: elRef,
        style: { minHeight: props.minHeight },
      });
  },
});

export default CodeMergeEditor;
