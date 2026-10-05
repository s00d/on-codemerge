<template>
  <div>
    <h1 v-if="showDescription">Tables Editor</h1>
    <p v-if="showDescription">
      Standalone grid editor — columns and rows as JSON SoT. Persist via
      <code>getText</code> / <code>setText</code> (TableGridDoc).
    </p>
    <hr />
    <div ref="editorContainer" class="editorBlock" />
    <hr />
    <div>
      Preview HTML (<code>getHTML()</code>):
      <div class="preview ocm-content prose prose-zinc max-w-none" v-html="htmlContent" />
    </div>
    <details class="html-source">
      <summary>HTML source</summary>
      <pre class="result">{{ htmlContent }}</pre>
    </details>
    <hr />
    <div>
      TableGridDoc JSON (<code>getText()</code>):
      <pre class="result">{{ textContent }}</pre>
    </div>
  </div>
</template>

<script>
import { Editor, createDefaultPlugins } from '../../apps/tables/src/app';

const DEMO_GRID = `{
  "version": 2,
  "columns": [
    { "id": "name", "title": "Name", "type": "text", "width": 160 },
    { "id": "qty", "title": "Qty", "type": "number", "width": 96 }
  ],
  "rows": [
    { "id": "r1", "cells": { "name": "Apples", "qty": 3 } },
    { "id": "r2", "cells": { "name": "Oranges", "qty": 2 } }
  ]
}`;

export default {
  beforeUnmount() {
    this.editor?.destroy();
  },
  data() {
    return { textContent: '', htmlContent: '', editor: null };
  },
  mounted() {
    if (!this.$refs.editorContainer) {
      return;
    }
    const editor = new Editor(this.$refs.editorContainer, {
      chrome: this.chrome,
      plugins: createDefaultPlugins(),
    });
    const sync = () => {
      this.textContent = editor.getText();
      this.htmlContent = editor.getHTML();
    };
    editor.on('docChanged', sync);
    editor.setText(DEMO_GRID);
    sync();
    this.editor = editor;
  },
  props: {
    showDescription: { default: true, type: Boolean },
    chrome: { default: 'bar', type: String },
  },
};
</script>

<style scoped>
.editorBlock {
  display: flex;
  flex-direction: column;
  height: 420px;
  max-height: 70vh;
  min-height: 240px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  overflow: hidden;
  resize: vertical;
}
.editorBlock :deep(.ocm-editor-root) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.editorBlock :deep(.ocm-toolbar-host) {
  flex-shrink: 0;
}
.editorBlock :deep(.ocm-shell-content),
.editorBlock :deep(.ocm-table-root) {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.preview {
  max-height: 280px;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  background: var(--color-ocm-surface, #fff);
  overflow: auto;
}
.preview :deep(table.html-editor-table--sheet.html-editor-table--content) {
  width: max-content;
  max-width: none;
}
.preview :deep(table.html-editor-table--fill) {
  width: 100%;
  max-width: 100%;
}
.html-source {
  margin-top: 8px;
}
.result {
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  padding: 10px;
  white-space: pre-wrap;
}
</style>
