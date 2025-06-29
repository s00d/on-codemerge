---
sidebar_position: 5
---

# Nuxt.js 3

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
  showOutput?: boolean;
}

interface Emits {
  (e: 'update:value', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  showOutput: false
});

const emit = defineEmits<Emits>();

const { editorRef, currentContent } = useEditor({
  value: props.value,
  onChange: (value) => emit('update:value', value)
});
</script>

<style scoped>
.output {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.output pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
```

3. **Use in a Page**:

```vue title="pages/index.vue"
<template>
  <div class="container">
    <h1>Nuxt 3 App with On-Codemerge</h1>
    <MyEditor 
      v-model:value="content" 
      :showOutput="true"
    />
    <div class="controls">
      <button @click="saveContent">Save Content</button>
      <button @click="loadContent">Load Content</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const content = ref('<p>Initial content</p>');

const saveContent = () => {
  console.log('Saving content:', content.value);
  // Add your save logic here
};

const loadContent = () => {
  content.value = '<p>Loaded content</p>';
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  margin-top: 20px;
}

.controls button {
  margin-right: 10px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  cursor: pointer;
}

.controls button:hover {
  background: #e9ecef;
}
</style>
```

4. **Nuxt Configuration**:

```typescript title="nuxt.config.ts"
export default defineNuxtConfig({
  ssr: false, // Disable SSR for editor component
  css: [
    'on-codemerge/public.css',
    'on-codemerge/index.css',
    'on-codemerge/plugins/ToolbarPlugin/style.css',
    'on-codemerge/plugins/AlignmentPlugin/public.css',
    'on-codemerge/plugins/AlignmentPlugin/style.css'
  ],
  build: {
    transpile: ['on-codemerge']
  }
});
```

## Key Features

- **Nuxt 3 Integration**: Full compatibility with Nuxt 3 Composition API
- **Composables**: Reusable editor logic with composables
- **TypeScript**: Complete TypeScript support with proper type definitions
- **v-model Support**: Two-way data binding with `v-model:value`
- **Plugin System**: Easy plugin registration and management
- **Localization**: Multi-language support
- **Content Management**: Simple HTML content setting and retrieval
