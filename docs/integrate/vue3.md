# Vue 3

Welcome to the Vue-specific documentation for **On-Codemerge**, a versatile web editor designed for seamless integration into Vue.js projects.

## Getting Started with Vue

To use On-Codemerge in a Vue.js application, install the package:

```bash
npm i --save on-codemerge
```

## Vue Integration Example

Here's an example of how to integrate On-Codemerge into a Vue.js project:

```vue title="MyEditorComponent.vue"
<template>
  <div ref="editorRef"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Editor, createCorePlugins, AlignmentPlugin, LanguagePlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

interface Props {
  value: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:value', value: string): void }>();
const editorRef = ref<HTMLElement | null>(null);
const editor = ref<Editor | null>(null);

onMounted(async () => {
  if (editorRef.value) {
    editor.value = new Editor(editorRef.value, {
      plugins: [...createCorePlugins(), AlignmentPlugin(), LanguagePlugin()],
    });

    await editor.value.setLocale('ru');

    editor.value.setHTML(props.value || 'Initial content goes here');

    editor.value.on('docChanged', () => {
      emit('update:value', editor.value!.getHTML());
    });
  }
});

watch(
  () => props.value,
  (newValue) => {
    if (editor.value && editor.value.getHTML() !== newValue) {
      editor.value.setHTML(newValue);
    }
  }
);
</script>
```

## Usage in Parent Component

```vue title="App.vue"
<template>
  <MyEditorComponent v-model:value="content" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MyEditorComponent from './MyEditorComponent.vue';

const content = ref('<p>Hello from Vue 3</p>');
</script>
```
