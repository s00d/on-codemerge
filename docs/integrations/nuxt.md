---
sidebar_position: 5
---

# Nuxt.js 3

Welcome to the Nuxt 3-specific documentation for **On-Codemerge**, an advanced web editor designed for seamless integration with Nuxt 3.

## Getting Started with Nuxt 3

To integrate On-Codemerge into your Nuxt 3 project, install the package:

```bash
npm i --save on-codemerge
```

## Nuxt 3 Integration Example

Here’s how to integrate On-Codemerge into a Nuxt 3 project:

1. **Create a Composable**:

```javascript title="composables/useEditor.js"
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

export default function useEditor() {
  const editorRef = ref(null);
  let editor;

  onMounted(async () => {
    editor = new HTMLEditor(editorRef.value);

    await editor.setLocale('ru');

    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());

    editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
    });

    editor.setHtml('Initial content goes here');
    console.log(editor.getHtml());
  });

  onBeforeUnmount(() => {
    if (editor) {
      editor.destroy();
    }
  });

  return {
    editorRef
  };
}
```

2. **Use the Composable in a Component**:

```vue title="components/MyEditor.vue"
<template>
  <div ref="editorRef"></div>
</template>

<script setup>
import useEditor from '~/composables/useEditor';

const { editorRef } = useEditor();
</script>
```
