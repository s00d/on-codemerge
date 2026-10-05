<template>
  <div>
    <h1 v-if="showDescription">Tables Editor</h1>
    <p v-if="showDescription">
      Standalone grid editor — columns and rows as JSON SoT. Persist via
      <code>getText</code> / <code>setText</code> (TableGridDoc).
    </p>
    <hr />
    <div class="editorShell" :style="{ height: `${editorH}px` }">
      <div ref="editorContainer" class="editorBlock" />
      <button
        type="button"
        class="editorShell__se"
        aria-label="Resize editor"
        @pointerdown="startResize"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M7 16 L16 7 M10.5 16 L16 10.5 M14 16 L16 14" />
        </svg>
      </button>
    </div>
    <hr />
    <div class="preview-block">
      <div class="preview-label">Preview HTML (<code>getHTML()</code>)</div>
      <div class="preview ocm-content" v-html="htmlContent" />
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
    return { textContent: '', htmlContent: '', editor: null, editorH: 420 };
  },
  methods: {
    startResize(ev) {
      if (ev.button !== 0) {
        return;
      }
      ev.preventDefault();
      const btn = ev.currentTarget;
      if (btn instanceof HTMLElement) {
        try {
          btn.setPointerCapture(ev.pointerId);
        } catch {
          /* pointer already released */
        }
      }
      const startY = ev.clientY;
      const startH = this.editorH;
      const minH = 240;
      const onMove = (e) => {
        const cap = Math.round(window.innerHeight * 0.9);
        this.editorH = Math.min(cap, Math.max(minH, startH + (e.clientY - startY)));
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
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
.editorShell {
  position: relative;
  min-height: 240px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  overflow: hidden;
}
.editorShell__se {
  position: absolute;
  right: 0;
  left: auto;
  bottom: 0;
  z-index: 40;
  display: flex;
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 3px;
  border: 0;
  border-radius: 6px 0 0 0;
  cursor: ns-resize;
  color: var(--vp-c-text-1, var(--color-ocm-text, #fafafa));
  background: rgb(255 255 255 / 14%);
}
.editorShell__se svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
}
.editorShell__se:hover,
.editorShell__se:focus-visible {
  color: var(--vp-c-brand-1, #60a5fa);
  background: rgb(255 255 255 / 22%);
}
.editorBlock {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
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
.preview-block {
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-ocm-surface, #fff);
}
.preview-label {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-ocm-border, #ddd);
  background: var(--color-ocm-surface-muted, #f8fafc);
  font-size: 12px;
  color: var(--color-ocm-text-muted, #71717a);
}
.preview {
  padding: 0;
  overflow: visible;
}
.preview :deep(table.html-editor-table) {
  margin: 0;
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
