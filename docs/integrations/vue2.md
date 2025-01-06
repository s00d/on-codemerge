---
sidebar_position: 2
---

# Vue 2

Welcome to the Vue 2-specific documentation for **On-Codemerge**, a versatile web editor designed for seamless integration with Vue.js 2 projects.

## Getting Started with Vue 2 Integration

To integrate On-Codemerge into a Vue.js 2 project, install the package:

```bash
npm i --save on-codemerge
```

## Vue 2 Integration Example

Here’s an example of how to integrate On-Codemerge into a Vue.js 2 component:

```vue title="OnCodemergeEditor.vue"
<template>
  <div ref="editorContainer"></div>
</template>

<script>
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import Vue from 'vue';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

export default {
  name: 'OnCodemergeEditor',
  props: {
    value: String
  },
  data() {
    return {
      editor: null
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);

    this.editor.setLocale('ru');

    this.editor.use(new ToolbarPlugin());
    this.editor.use(new AlignmentPlugin());

    this.editor.setHtml(this.value || 'Your initial content here');

    this.editor.subscribeToContentChange((newContent) => {
      this.$emit('input', newContent);
    });
  },
  watch: {
    value(newValue) {
      if (this.editor && this.editor.getHtml() !== newValue) {
        this.editor.setHtml(newValue);
      }
    }
  }
};
</script>
<style>
  @import 'on-codemerge/public.css';
  @import 'on-codemerge/index.css';
  @import 'on-codemerge/plugins/ToolbarPlugin/style.css';
  @import 'on-codemerge/plugins/AlignmentPlugin/public.css';
  @import 'on-codemerge/plugins/AlignmentPlugin/style.css';
</style>
```
