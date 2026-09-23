# Vue 3

Embed On-Codemerge in a Vue 3 app. Persist **JSON** (`getJSON` / `setJSON`), not HTML.

## Install

```bash
npm install on-codemerge
```

## Minimal example

```vue
<template>
  <div ref="host" style="min-height: 300px" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

type DocJson = ReturnType<Editor['getJSON']>;

const props = defineProps<{ modelValue?: DocJson }>();
const emit = defineEmits<{ 'update:modelValue': [DocJson] }>();

const host = ref<HTMLElement | null>(null);
let editor: Editor | null = null;

const fallback: DocJson = {
  version: 1,
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello from Vue 3' }] }],
  },
};

onMounted(() => {
  if (!host.value) return;
  editor = new Editor(host.value, { plugins: createCorePlugins() });
  editor.setJSON(props.modelValue ?? fallback);
  editor.on('docChanged', () => emit('update:modelValue', editor!.getJSON()));
});

onBeforeUnmount(() => {
  editor?.destroy();
  editor = null;
});

watch(
  () => props.modelValue,
  (next) => {
    if (!editor || !next) return;
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(next)) return;
    editor.setJSON(next);
  }
);
</script>
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import MyEditor from './MyEditor.vue';

const doc = ref({
  version: 1,
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial' }] }],
  },
});
</script>

<template>
  <MyEditor v-model="doc" />
</template>
```

## Persist

```ts
editor.on('docChanged', () => {
  const json = editor.getJSON();
  // POST / save
});
```

HTML / Markdown are boundaries only.

## Gotchas

- Destroy the editor in `onBeforeUnmount`.
- Guard `setJSON` from props against equality to avoid loops.
- Import both CSS entry points.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
