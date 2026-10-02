<template>
  <div>
    <h1 v-if="showDescription">Forms Editor</h1>
    <p v-if="showDescription">
      Standalone form builder — palette, live preview, inspector. Persist via
      <code>getText</code> / <code>setText</code> (FormConfig JSON).
    </p>
    <hr />
    <div ref="editorContainer" class="editorBlock" />
    <hr />
    <div>
      Live preview (rendered form):
      <div ref="previewHost" class="preview" />
    </div>
    <hr />
    <div>
      FormConfig JSON (<code>getText()</code>):
      <pre class="result">{{ textContent }}</pre>
    </div>
  </div>
</template>

<script>
import { mount } from '@codemerge/sdk';
import { Editor, createDefaultPlugins, isFormConfig, formView } from '../../apps/forms/src/app';

const DEMO_FORM = `{
  "id": "demo-contact",
  "method": "POST",
  "action": "/submit",
  "className": "generated-form",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Name",
      "options": { "name": "name", "placeholder": "Your name" },
      "validation": { "required": true }
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email",
      "options": { "name": "email", "placeholder": "you@example.com" },
      "validation": { "required": true }
    }
  ]
}`;

export default {
  beforeUnmount() {
    this.previewMount?.destroy();
    this.editor?.destroy();
  },
  data() {
    return { textContent: '', editor: null, previewMount: null };
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
      this.previewMount?.destroy();
      this.previewMount = null;
      const host = this.$refs.previewHost;
      if (!(host instanceof HTMLElement)) {
        return;
      }
      try {
        const parsed = JSON.parse(this.textContent || '{}');
        if (!isFormConfig(parsed)) {
          host.replaceChildren();
          host.textContent = 'Invalid FormConfig';
          return;
        }
        this.previewMount = mount(host, formView(parsed, { preventSubmit: true, i18n: editor }));
      } catch {
        host.replaceChildren();
        host.textContent = 'Invalid JSON';
      }
    };
    editor.on('docChanged', sync);
    editor.setText(DEMO_FORM);
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
  height: 520px;
  max-height: 70vh;
  min-height: 360px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  overflow: hidden;
}
.preview {
  min-height: 120px;
  padding: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  background: var(--color-ocm-surface, #fff);
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
