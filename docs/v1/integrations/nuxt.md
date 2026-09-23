# Nuxt.js 3

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Nuxt 3-specific documentation for **On-Codemerge**, an advanced web editor designed for seamless integration with Nuxt 3.

## Getting Started with Nuxt 3

To integrate On-Codemerge into your Nuxt 3 project, install the package:

```bash
npm install on-codemerge
```

## Nuxt 3 Integration Example

Here's how to integrate On-Codemerge into a Nuxt 3 project:

1. **Create a Composable**:

```typescript title="composables/useEditor.ts"
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

interface UseEditorOptions {
  value?: string;
  onChange?: (value: string) => void;
}

export default function useEditor(options: UseEditorOptions = {}) {
  const editorRef = ref<HTMLElement | null>(null);
  const editor = ref<HTMLEditor | null>(null);
  const currentContent = ref<string>('');

  onMounted(async () => {
    if (editorRef.value) {
      editor.value = new HTMLEditor(editorRef.value);

      // Set locale
      await editor.value.setLocale('ru');

      // Register plugins
      editor.value.use(new ToolbarPlugin());
      editor.value.use(new AlignmentPlugin());

      // Subscribe to content changes
      editor.value.subscribeToContentChange((newContent) => {
        currentContent.value = newContent;
        if (options.onChange) {
          options.onChange(newContent);
        }
      });

      // Set initial content
      if (options.value) {
        editor.value.setHtml(options.value);
      } else {
        editor.value.setHtml('<p>Welcome to On-Codemerge with Nuxt 3!</p>');
      }

      currentContent.value = editor.value.getHtml();
    }
  });

  onBeforeUnmount(() => {
    if (editor.value) {
      editor.value.destroy();
    }
  });

  return {
    editorRef,
    editor,
    currentContent
  };
}
```

2. **Use the Composable in a Component**:

```vue title="components/MyEditor.vue"
<template>
  <div>
    <div ref="editorRef" style="min-height: 300px;"></div>
    <div v-if="showOutput" class="output">
      <h3>Current HTML:</h3>
      <pre>{{ currentContent }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value?: string;

_…trimmed for the v1 archive. See source history for the full guide._
