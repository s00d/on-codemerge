---
sidebar_position: 2
---

# Vue 2

Welcome to the Vue 2-specific documentation for **On-Codemerge**, a versatile web editor designed for seamless integration with Vue.js 2 projects.

## Getting Started with Vue 2 Integration

To integrate On-Codemerge into a Vue.js 2 project, install the package:

```bash
npm install on-codemerge
```

## Vue 2 Integration Example

Here's an example of how to integrate On-Codemerge into a Vue.js 2 component:

```vue title="OnCodemergeEditor.vue"
<template>
  <div>
    <div ref="editorContainer" style="min-height: 300px;"></div>
    <div v-if="showOutput" class="output">
      <h3>Current HTML:</h3>
      <pre>{{ currentContent }}</pre>
    </div>
  </div>
</template>

<script>
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

export default {
  name: 'OnCodemergeEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    showOutput: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      editor: null,
      currentContent: ''
    };
  },
  mounted() {
    this.initEditor();
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    async initEditor() {
      if (this.$refs.editorContainer) {
        this.editor = new HTMLEditor(this.$refs.editorContainer);

        // Set locale
        await this.editor.setLocale('ru');

        // Register plugins
        this.editor.use(new ToolbarPlugin());
        this.editor.use(new AlignmentPlugin());

        // Set initial content
        if (this.value) {
          this.editor.setHtml(this.value);
        } else {
          this.editor.setHtml('<p>Welcome to On-Codemerge with Vue 2!</p>');
        }

        // Subscribe to content changes
        this.editor.subscribeToContentChange((newContent) => {
          this.currentContent = newContent;
          this.$emit('input', newContent);
        });

        // Set initial content for output
        this.currentContent = this.editor.getHtml();
      }
    }
  },
  watch: {
    value(newValue) {
      if (this.editor && newValue !== this.editor.getHtml()) {
        this.editor.setHtml(newValue);
      }
    }
  }
};
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

## Usage Example

```vue title="App.vue"
<template>
  <div id="app">
    <h1>Vue 2 App with On-Codemerge</h1>
    <OnCodemergeEditor 
      v-model="content" 
      :showOutput="true"
    />
    <div class="controls">
      <button @click="saveContent">Save Content</button>
      <button @click="loadContent">Load Content</button>
    </div>
  </div>
</template>

<script>
import OnCodemergeEditor from './OnCodemergeEditor.vue';

export default {
  name: 'App',
  components: {
    OnCodemergeEditor
  },
  data() {
    return {
      content: '<p>Initial content</p>'
    };
  },
  methods: {
    saveContent() {
      console.log('Saving content:', this.content);
      // Add your save logic here
    },
    loadContent() {
      this.content = '<p>Loaded content</p>';
    }
  }
};
</script>

<style>
#app {
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

## Key Features

- **Vue 2 Compatibility**: Full support for Vue 2 Options API
- **v-model Support**: Two-way data binding with `v-model`
- **Component Lifecycle**: Proper cleanup in `beforeDestroy`
- **Plugin System**: Easy plugin registration and management
- **Localization**: Built-in multi-language support
- **Content Management**: Simple HTML content setting and retrieval
