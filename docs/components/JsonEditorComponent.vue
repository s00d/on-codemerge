<template>
  <div>
    <h1 v-if="showDescription">JSON Editor</h1>
    <p v-if="showDescription">
      Tree + Raw JSON editor — same Editor API surface as WYSIWYG, plain JSON via
      <code>getText</code> / <code>setText</code>.
    </p>
    <hr />
    <div ref="editorContainer" class="editorBlock" />
    <hr />
    <div>
      Plain JSON (<code>getText()</code>):
      <pre class="result">{{ textContent }}</pre>
    </div>
  </div>
</template>

<script>
import { Editor, createDefaultPlugins } from '../../apps/json/src/app';

const DEMO_JSON = `{
  "hello": "json editor",
  "items": [1, true, null],
  "nested": { "ok": true }
}`;

export default {
  beforeUnmount() {
    this.editor?.destroy();
  },
  data() {
    return { textContent: '', editor: null };
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
    };
    editor.on('docChanged', sync);
    editor.setText(DEMO_JSON);
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
  min-height: 280px;
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
