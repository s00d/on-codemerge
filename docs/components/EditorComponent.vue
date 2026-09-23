<template>
  <div>
    <h1 v-if="showDescription">on-CodeMerge</h1>
    <p v-if="showDescription">
      Plugin-oriented editor — toolbar/modals in core, plugins register into SDK.
    </p>
    <hr />
    <div
      ref="editorContainer"
      class="editorBlock"
      :class="{ 'editorBlock--page': chrome === 'page' }"
    />
    <template v-if="chrome !== 'page'">
      <hr />
      <div>
        Result (JSON):
        <pre class="result">{{ editorContent }}</pre>
      </div>
      <hr />
      <div>
        Preview (published HTML):
        <div
          id="preview"
          ref="preview"
          class="preview ocm-content prose prose-zinc max-w-none"
          v-html="previewContent"
        />
      </div>
      <hr />
      <div>
        HTML source (published):
        <pre class="result">{{ previewContent }}</pre>
      </div>
    </template>
  </div>
</template>

<script>
import { ensurePublishRuntimesRegistered, publishRuntimes } from '../../src/publish/runtimes';
import {
  Editor,
  createDefaultPlugins,
  ToolbarPlugin,
  ToolbarDividerPlugin,
  HistoryPlugin,
  TypographyPlugin,
  ColorPlugin,
  FontPlugin,
  LinkPlugin,
  AlignmentPlugin,
  ListsPlugin,
  BlockPlugin,
  BlockStylePlugin,
  TablePlugin,
  ImagePlugin,
  VideoPlugin,
  YouTubeVideoPlugin,
  FileUploadPlugin,
  PDFEmbedPlugin,
  CodeBlockPlugin,
  MathPlugin,
  ChartsPlugin,
  CalendarPlugin,
  TimerPlugin,
  FormBuilderPlugin,
  CommentsPlugin,
  MentionsPlugin,
  FootnotesPlugin,
  FooterPlugin,
  CollaborationPlugin,
  ShortcutsPlugin,
  ExportPlugin,
  HTMLViewerPlugin,
  TemplatesPlugin,
  ResponsivePlugin,
  LanguagePlugin,
  SpellCheckerPlugin,
  AIAssistantPlugin,
  TrackChangesPlugin,
  AnchorLinkPlugin,
} from '../../src/app';

// dictionary-en package `exports` only exposes index.js (Node fs) — load Hunspell files as Vite URLs.
const enAffUrl = new URL('../../node_modules/dictionary-en/index.aff', import.meta.url).href;
const enDicUrl = new URL('../../node_modules/dictionary-en/index.dic', import.meta.url).href;

const SPELL_DICTIONARIES = {
  en: { aff: enAffUrl, dic: enDicUrl },
};

const PLUGIN_MAP = {
  ToolbarPlugin,
  ToolbarDividerPlugin,
  HistoryPlugin,
  TypographyPlugin,
  ColorPlugin,
  FontPlugin,
  LinkPlugin,
  AlignmentPlugin,
  ListsPlugin,
  BlockPlugin,
  BlockStylePlugin,
  TablePlugin,
  ImagePlugin,
  VideoPlugin,
  YouTubeVideoPlugin,
  FileUploadPlugin,
  PDFEmbedPlugin,
  CodeBlockPlugin,
  MathPlugin,
  ChartsPlugin,
  CalendarPlugin,
  TimerPlugin,
  FormBuilderPlugin,
  CommentsPlugin,
  MentionsPlugin,
  FootnotesPlugin,
  FooterPlugin,
  CollaborationPlugin,
  ShortcutsPlugin,
  ExportPlugin,
  HTMLViewerPlugin,
  TemplatesPlugin,
  ResponsivePlugin,
  LanguagePlugin,
  SpellCheckerPlugin,
  AIAssistantPlugin,
  TrackChangesPlugin,
  AnchorLinkPlugin,
};

const DEMO_HTML = `
<h1>on-CodeMerge demo</h1>
<p>Hello with <strong>bold</strong>, <em>italic</em>, <u>underline</u> and <s>strike</s>.</p>
<blockquote>Tip: Enter in a list splits the item; Enter on an empty item exits the list.</blockquote>
<ul>
  <li>Bullet one</li>
  <li>Bullet two</li>
</ul>
<ol>
  <li>Ordered one</li>
  <li>Ordered two</li>
</ol>
<p>Sample table (right-click cells for row/col/merge/sort):</p>
<table class="html-editor-table not-prose">
  <tbody>
    <tr>
      <td>Cell 1 - 1</td>
      <td>Cell 1 - 2</td>
    </tr>
    <tr>
      <td>Cell 2 - 1</td>
      <td>Cell 2 - 2</td>
    </tr>
  </tbody>
</table>
<p>Edit above — JSON and HTML update below.</p>
`.trim();

function resolvePlugins(activePlugins) {
  if (!activePlugins || activePlugins.length === 0) {
    return createDefaultPlugins();
  }
  const names = [...activePlugins];
  // Essentials so demos always have marks + history when filtering
  for (const required of ['ToolbarPlugin', 'HistoryPlugin']) {
    if (!names.includes(required)) {
      names.unshift(required);
    }
  }
  return names
    .map((name) => {
      const factory = PLUGIN_MAP[name];
      if (!factory) {
        console.warn(`[EditorComponent] Unknown plugin: ${name}`);
        return null;
      }
      if (name === 'SpellCheckerPlugin') {
        return SpellCheckerPlugin({ dictionaries: SPELL_DICTIONARIES });
      }
      return factory();
    })
    .filter(Boolean);
}

ensurePublishRuntimesRegistered();

export default {
  beforeUnmount() {
    const preview = this.$refs.preview;
    if (preview instanceof HTMLElement) {
      publishRuntimes.unboot(preview);
    }
    this.editor?.destroy();
  },
  data() {
    return { editorContent: '', previewContent: '', editor: null };
  },
  mounted() {
    if (!this.$refs.editorContainer) {
      return;
    }
    const editor = new Editor(this.$refs.editorContainer, {
      chrome: this.chrome,
      plugins: resolvePlugins(this.activePlugins),
    });
    const syncPreviewRuntimes = () => {
      this.$nextTick(() => {
        const preview = this.$refs.preview;
        if (!(preview instanceof HTMLElement)) {
          return;
        }
        publishRuntimes.unboot(preview);
        publishRuntimes.boot(preview);
      });
    };
    const sync = () => {
      const preview = this.$refs.preview;
      if (preview instanceof HTMLElement) {
        publishRuntimes.unboot(preview);
      }
      this.editorContent = JSON.stringify(editor.getJSON(), null, 2);
      this.previewContent = editor.getPublishedHTML();
      syncPreviewRuntimes();
    };
    editor.on('docChanged', sync);
    editor.setHTML(DEMO_HTML);
    sync();
    this.editor = editor;
  },
  props: {
    activePlugins: { default: () => [], type: Array },
    showDescription: { default: true, type: Boolean },
    chrome: { default: 'bar', type: String },
  },
};
</script>

<style scoped>
.editorBlock {
  min-height: 200px;
}
.editorBlock--page {
  height: 70vh;
  min-height: 70vh;
}
.result {
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  padding: 10px;
  white-space: pre-wrap;
}
.preview {
  border: 1px solid var(--color-ocm-border, #ddd);
  padding: 10px;
  min-height: 80px;
}
</style>
