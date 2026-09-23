# Vue 2

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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

_…trimmed for the v1 archive. See source history for the full guide._
