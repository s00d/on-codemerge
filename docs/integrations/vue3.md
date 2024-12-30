---
sidebar_position: 3
---

# Vue 3

Welcome to the Vue-specific documentation for **On-Codemerge**, a versatile web editor designed for seamless integration into Vue.js projects.

## Getting Started with Vue

To use On-Codemerge in a Vue.js application, install the package:

```bash
npm i --save on-codemerge
```

## Vue Integration Example

Here’s an example of how to integrate On-Codemerge into a Vue.js project:

```vue title="MyEditorComponent.vue"
<template>
  <div ref="editorRef"></div>
</template>

<script>
import { onMounted, ref, watch } from 'vue';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

export default {
  name: 'MyEditorComponent',
  props: {
    value: String
  },
  setup(props, { emit }) {
    const editorRef = ref(null);
    const editor = ref(null);

    onMounted(async () => {
      if (editorRef.value) {
        editor.value = new HTMLEditor(editorRef.value);

        await editor.value.setLocale('ru');

        editor.value.use(new ToolbarPlugin());
        editor.value.use(new AlignmentPlugin());

        editor.value.setHtml(props.value || 'Initial content goes here');

        editor.value.subscribeToContentChange((newContent) => {
          emit('update:value', newContent);
        });
      }
    });

    watch(() => props.value, (newValue) => {
      if (editor.value && editor.value.getHtml() !== newValue) {
        editor.value.setHtml(newValue);
      }
    });

    return {
      editorRef
    };
  }
};
</script>
```
