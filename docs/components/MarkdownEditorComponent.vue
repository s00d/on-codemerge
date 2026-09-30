<template>
  <div>
    <h1 v-if="showDescription">Markdown Editor</h1>
    <p v-if="showDescription">
      Dual-pane Markdown editor — SoT is prose JSON. Persist via
      <code>getText</code> / <code>setText</code> or <code>getJSON</code> / <code>setJSON</code>;
      preview HTML via <code>getHTML</code> / <code>setHTML</code>.
    </p>
    <hr />
    <div ref="editorContainer" class="editorBlock" />
    <hr />
    <div>
      Result (JSON):
      <pre class="result">{{ jsonContent }}</pre>
    </div>
    <hr />
    <div>
      Plain Markdown (<code>getText()</code>):
      <pre class="result">{{ textContent }}</pre>
    </div>
    <div>
      Preview HTML (<code>getHTML()</code> + mermaid hydrate):
      <div ref="htmlPreview" class="result ocm-md-preview" v-html="htmlContent" />
    </div>
    <details class="html-source">
      <summary>HTML source</summary>
      <pre class="result">{{ htmlContent }}</pre>
    </details>
  </div>
</template>

<script>
import {
  Editor,
  createMdElementRegistry,
  defaultMdToolbar,
  hydrateMermaidBlocks,
  runInsertMarkdown,
} from '../../apps/markdown/src/app';
import { docsMdPreview } from './devMediaConfig';

const DEMO_MD = `# Markdown editor

Edit on the **left**. Preview on the right.

:::info Tip
Use **Insert** / **Turn into** for callouts.

@btn[Action](#)
:::

:::tip Note
Custom \`elements\` + \`toolbar.items\` are registered in the Editor constructor.

@btn[Docs](#)
:::

:::warn Caution
Cursor inside a callout → **Turn into** changes the type.

@btn[Got it](#)
:::

\`\`\`mermaid
flowchart LR
  A[Source] --> B[Preview]
\`\`\`
`;

export default {
  beforeUnmount() {
    this.hydrateAbort?.abort();
    this.editor?.destroy();
  },
  data() {
    return {
      jsonContent: '',
      textContent: '',
      htmlContent: '',
      editor: null,
      hydrateAbort: null,
    };
  },
  mounted() {
    if (!this.$refs.editorContainer) {
      return;
    }
    const tipElement = {
      id: 'tip',
      label: 'Tip',
      defaultTitle: 'Note',
      toPreviewHtml: (block, bodyHtml) => {
        const title = block.title.trim()
          ? `<div class="ocm-md-callout__title">${block.title}</div>`
          : '';
        return `<aside class="ocm-md-callout ocm-md-callout--info" data-node="callout" data-variant="tip" data-ocm-callout="tip">${title}<div class="ocm-md-callout__body">${bodyHtml}</div></aside>`;
      },
    };
    const registry = createMdElementRegistry([tipElement]);
    const base = defaultMdToolbar({ elements: registry });
    const editor = new Editor(this.$refs.editorContainer, {
      chrome: this.chrome,
      elements: [tipElement],
      ...(docsMdPreview ? { preview: docsMdPreview } : {}),
      // toolbar replaces the domain preset — spread defaultMdToolbar, then extras.
      toolbar: {
        menus: [...(base.menus ?? []), { id: 'md-tools', label: 'Tools', order: 20 }],
        items: [
          ...(base.items ?? []),
          {
            id: 'md-demo-stamp',
            label: 'Stamp',
            menu: 'md-insert',
            order: 90,
            run: runInsertMarkdown(() => `<!-- demo stamp ${Date.now()} -->\n`),
          },
          {
            id: 'md-demo-mermaid',
            label: 'Mermaid',
            menu: 'md-tools',
            command: 'insertMdMermaid',
          },
        ],
      },
    });
    const sync = () => {
      this.jsonContent = JSON.stringify(editor.getJSON(), null, 2);
      this.textContent = editor.getText();
      this.htmlContent = editor.getHTML();
      this.$nextTick(() => {
        const slot = this.$refs.htmlPreview;
        if (!(slot instanceof HTMLElement)) {
          return;
        }
        this.hydrateAbort?.abort();
        const ac = new AbortController();
        this.hydrateAbort = ac;
        void hydrateMermaidBlocks(slot, { signal: ac.signal });
      });
    };
    editor.on('docChanged', sync);
    editor.setText(DEMO_MD);
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
  height: 480px;
  max-height: 60vh;
  min-height: 320px;
}
.result {
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  padding: 10px;
  white-space: pre-wrap;
}
.ocm-md-preview {
  white-space: normal;
}
.html-source {
  margin-top: 0.5rem;
}
</style>
