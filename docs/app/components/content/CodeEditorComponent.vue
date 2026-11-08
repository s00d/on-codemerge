<template>
  <div class="ocm-demo">
    <div ref="editorContainer" class="editorBlock" />
    <hr />
    <div>
      Plain source (<code>getText()</code>):
      <pre class="result">{{ textContent }}</pre>
    </div>
  </div>
</template>

<script>
import { Editor, createDefaultPlugins } from '../../../../apps/code/src/app';

const DEMO_CODE = `// Code Editor demo
const greet = (name) => {
  return \`hello, \${name}\`;
};

greet('on-codemerge');
`;

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
    editor.setText(DEMO_CODE);
    sync();
    this.editor = editor;
  },
  props: {
    chrome: { default: 'bar', type: String },
  },
};
</script>

<style scoped>
.editorBlock {
  display: flex;
  flex-direction: column;
  height: 320px;
  max-height: 50vh;
  min-height: 240px;
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
