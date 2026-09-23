# Vue 3

Embed On-Codemerge in Vue 3. Load / save with **HTML** (or Markdown).

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

const props = defineProps<{ modelValue?: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

const host = ref<HTMLElement | null>(null);
let editor: Editor | null = null;

onMounted(() => {
  if (!host.value) return;
  editor = new Editor(host.value, { plugins: createCorePlugins() });
  editor.setHTML(props.modelValue ?? '<p>Hello from Vue 3</p>');
  editor.on('docChanged', () => emit('update:modelValue', editor!.getHTML()));
});

onBeforeUnmount(() => {
  editor?.destroy();
  editor = null;
});

watch(
  () => props.modelValue,
  (next) => {
    if (!editor || next === undefined) return;
    if (editor.getHTML() === next) return;
    editor.setHTML(next);
  }
);
</script>
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import MyEditor from './MyEditor.vue';
const html = ref('<p>Initial</p>');
</script>
<template>
  <MyEditor v-model="html" />
</template>
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
