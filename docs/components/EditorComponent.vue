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
    <template v-if="showResults && chrome !== 'page'">
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
import {
  ensurePublishRuntimesRegistered,
  publishRuntimes,
} from '../../apps/wysiwyg/src/publish/runtimes';
import { Editor } from '../../apps/wysiwyg/src/editor/Editor';
import {
  createDefaultPlugins,
  ToolbarPlugin,
  HistoryPlugin,
  TypographyPlugin,
  ColorPlugin,
  FontPlugin,
  LinkPlugin,
  ClearStylesPlugin,
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
  JsonPlugin,
  MarkdownPlugin,
} from '@ocm/plugins';
import { docsFileUpload, docsImageUpload } from './devMediaConfig';

// dictionary-en package `exports` only exposes index.js (Node fs) — load Hunspell files as Vite URLs.
const enAffUrl = new URL('../../node_modules/dictionary-en/index.aff', import.meta.url).href;
const enDicUrl = new URL('../../node_modules/dictionary-en/index.dic', import.meta.url).href;

const SPELL_DICTIONARIES = {
  en: { aff: enAffUrl, dic: enDicUrl },
};

const PLUGIN_MAP = {
  ToolbarPlugin,
  HistoryPlugin,
  TypographyPlugin,
  ColorPlugin,
  FontPlugin,
  LinkPlugin,
  ClearStylesPlugin,
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
  JsonPlugin,
  MarkdownPlugin,
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

/** Escape a value for a double-quoted HTML attribute (JSON → entities). */
function jsonAttr(value) {
  return JSON.stringify(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

const CHART_SERIES = [
  {
    name: 'Sales',
    data: [
      { label: 'Q1', value: 12 },
      { label: 'Q2', value: 19 },
    ],
  },
];
const FORM_SCHEMA = {
  id: 'demo_form',
  action: '/demo',
  method: 'POST',
  fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
};
const CALENDAR_PAYLOAD = {
  calendar: { id: 'cal_demo', title: 'Team calendar', description: '', events: [] },
  events: [
    {
      id: 'ev1',
      title: 'Kickoff',
      start: '2030-06-01T10:00:00.000Z',
      end: '2030-06-01T11:00:00.000Z',
    },
  ],
};
const TIMER_PAYLOAD = { id: 't_demo', title: 'Launch', targetDate: '2030-01-01T00:00:00.000Z' };
const BLOCK_TREE = { kind: 'split', dir: 'row', children: [{ kind: 'leaf' }, { kind: 'leaf' }] };
const FOOTNOTE_ITEMS = [
  { id: 'fn_1', note: 'First footnote sample.' },
  { id: 'fn_2', note: 'Second footnote sample.' },
];
const JSON_EMBED_BODY = JSON.stringify(
  { hello: 'json embed', items: [1, true, null], nested: { ok: true } },
  null,
  2
);
const MD_EMBED_BODY = '# Markdown embed\n\nHello **world**.\n\nUse Apply / blur to commit.\n';

/**
 * Focused seed HTML keyed by primary plugin name (used when `initialHtml` is empty
 * and `activePlugins` targets a single feature demo).
 */
const DEMO_HTML_BY_PLUGIN = {
  ToolbarPlugin: `
<h2>Toolbar marks</h2>
<p>Select text and toggle <strong>bold</strong>, <em>italic</em>, <u>underline</u>, or <s>strike</s> from the bar.</p>
<p>Try selecting this sentence and applying marks.</p>
`.trim(),

  HistoryPlugin: `
<h2>History</h2>
<p>Edit this paragraph, then use Undo / Redo (toolbar or Mod-Z / Mod-Shift-Z).</p>
<p>Each change is recorded — undo restores the previous state.</p>
`.trim(),

  TypographyPlugin: `
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<p>Body paragraph. Use the typography control to change heading levels or turn into a blockquote.</p>
<blockquote><p>Quoted tip — try Turn into from the toolbar.</p></blockquote>
`.trim(),

  ColorPlugin: `
<h2>Text &amp; highlight color</h2>
<p>Select words below and set text or highlight color from the toolbar.</p>
<p><span style="color:#0284c7">Sky text</span> and <span style="background-color:#fef08a">yellow highlight</span> already applied.</p>
`.trim(),

  FontPlugin: `
<h2>Font settings</h2>
<p>Open the font panel to change family, size, and line height.</p>
<p><span style="font-family:Georgia, serif; font-size:20px">Georgia 20px sample</span> — select and adjust.</p>
`.trim(),

  LinkPlugin: `
<h2>Links</h2>
<p>Select text and insert a link, or edit the sample below.</p>
<p>Visit <a href="https://example.com">example.com</a> — click the link button to change the URL.</p>
`.trim(),

  ClearStylesPlugin: `
<h2>Clear styles</h2>
<p>Sample with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, and <s>strike</s>.</p>
<p data-align="center"><span style="color:#0284c7;background-color:#fef08a">Colored + highlight + centered</span> — select a word and clear, or click Clear with no selection to wipe the whole doc.</p>
`.trim(),

  AlignmentPlugin: `
<h2 data-align="center">Centered heading</h2>
<p data-align="left">Left-aligned paragraph — use the alignment buttons to change left / center / right / justify.</p>
<p data-align="right">Right-aligned paragraph for contrast.</p>
`.trim(),

  ListsPlugin: `
<h2>Lists</h2>
<p>Toggle bullet and ordered lists from the toolbar. Enter splits items; empty Enter exits.</p>
<ul>
  <li>Bullet one</li>
  <li>Bullet two</li>
</ul>
<ol>
  <li>Ordered one</li>
  <li>Ordered two</li>
</ol>
`.trim(),

  BlockPlugin: `
<h2>Pane blocks</h2>
<p>A split pane container is seeded below. Right-click panes to rearrange or resize.</p>
<div data-node="block_container" data-layout="split" data-tree="${jsonAttr(BLOCK_TREE)}" data-width="0" data-height="0"></div>
`.trim(),

  BlockStylePlugin: `
<h2>Block style</h2>
<p data-style="${jsonAttr({ color: '#0f766e', 'font-size': '18px' })}">This paragraph has inline block style attrs. Open Block style to tweak padding, color, and more.</p>
<p>Select another block and apply a preset from the panel.</p>
`.trim(),

  TablePlugin: `
<h2>Table</h2>
<p>Right-click cells for row / column / merge / sort.</p>
<table class="html-editor-table not-prose">
  <tbody>
    <tr><td>Name</td><td>Role</td></tr>
    <tr><td>Ada</td><td>Engineer</td></tr>
    <tr><td>Grace</td><td>Lead</td></tr>
  </tbody>
</table>
`.trim(),

  ImagePlugin: `
<h2>Image</h2>
<p>Use Insert → Image to upload, or edit the placeholder below.</p>
<img src="https://placehold.co/320x180/png?text=Demo" alt="Demo placeholder" width="320" height="180" />
`.trim(),

  VideoPlugin: `
<h2>Video</h2>
<p>Use Insert → Video to upload a file. Empty video atom is ready below for the upload UI.</p>
<div data-node="video" data-src="" data-align="" data-width="0" data-height="0"></div>
`.trim(),

  YouTubeVideoPlugin: `
<h2>YouTube</h2>
<p>Sample embed — change the video via the toolbar or context menu.</p>
<div data-node="youtube" data-video-id="M7lc1UVf-VE" data-align="" data-width="640" data-height="360"></div>
`.trim(),

  FileUploadPlugin: `
<h2>File upload</h2>
<p>Use Insert → File to attach a downloadable file to the document.</p>
<p>Uploaded files appear as file atoms with name and size.</p>
`.trim(),

  PDFEmbedPlugin: `
<h2>PDF embed</h2>
<p>Use Insert → PDF to embed a document. Provide a https URL when prompted.</p>
<p>The embed renders in an iframe inside the editor and on published pages.</p>
`.trim(),

  CodeBlockPlugin: `
<h2>Code block</h2>
<p>Fenced code below — change language from the context menu.</p>
<pre data-language="ts"><code>function greet(name: string) {
  return \`Hello, \${name}\`;
}</code></pre>
`.trim(),

  MathPlugin: `
<h2>Math</h2>
<p>TeX-subset formula rendered as MathML. Edit via Insert → Math or the context menu.</p>
<div data-node="math" data-expression="E=mc^2" data-align="" data-width="400" data-height="80"></div>
`.trim(),

  ChartsPlugin: `
<h2>Chart</h2>
<p>Bar chart with sample series — right-click to edit data or export PNG.</p>
<div data-node="chart" data-chart-type="bar" data-title="Quarterly sales" data-width="420" data-height="240" data-show-legend="true" data-show-grid="true" data-data="${jsonAttr(CHART_SERIES)}"></div>
`.trim(),

  CalendarPlugin: `
<h2>Calendar</h2>
<p>Sample calendar atom — open the menu to add events and categories.</p>
<div data-node="calendar" data-title="Team calendar" data-calendar-id="cal_demo" data-payload="${jsonAttr(CALENDAR_PAYLOAD)}" data-align=""></div>
`.trim(),

  TimerPlugin: `
<h2>Countdown timer</h2>
<p>Timer targeting a future date — edit title and deadline from the widget.</p>
<div data-node="timer" data-title="Launch" data-payload="${jsonAttr(TIMER_PAYLOAD)}" data-align=""></div>
`.trim(),

  FormBuilderPlugin: `
<h2>Form builder</h2>
<p>Sample form with one text field — edit schema from the widget menu.</p>
<div data-node="form" data-schema="${jsonAttr(FORM_SCHEMA)}" data-action="/demo" data-align=""></div>
`.trim(),

  CommentsPlugin: `
<h2>Comments</h2>
<p>Select text and use Review → Comment (or Mod-Shift-C). Sample mark below:</p>
<p>This has a <mark data-comment="c_demo" title="Demo comment — try editing via the review menu">commented phrase</mark> already.</p>
`.trim(),

  MentionsPlugin: `
<h2>Mentions</h2>
<p>Type @ or use Review → Mention to tag someone. Sample mention:</p>
<p>Hello <span class="ocm-mention" data-mention-id="ada">@Ada</span> — try inserting another.</p>
`.trim(),

  FootnotesPlugin: `
<h2>Footnotes</h2>
<p>References look like this<sup class="ocm-footnote" data-footnote="fn_1">1</sup> in the body.</p>
<p>Use the footnotes tools to add notes; the list atom holds note text.</p>
<div data-node="footnote_list" data-items="${jsonAttr(FOOTNOTE_ITEMS)}"></div>
`.trim(),

  FooterPlugin: `
<h2>Document footer</h2>
<p>Word and character counts appear in the editor footer as you type.</p>
<p>Edit this text and watch the statistics update live.</p>
`.trim(),

  CollaborationPlugin: `
<h2>Collaboration</h2>
<p>Opt-in collaboration chrome — connect a provider in your app to sync cursors and presence.</p>
<p>This demo loads the plugin UI only; wire a backend for live sessions.</p>
`.trim(),

  ShortcutsPlugin: `
<h2>Shortcuts</h2>
<p>Open Tools → Shortcuts to browse registered hotkeys for loaded plugins.</p>
<p>Try Mod-Z for undo after editing this paragraph.</p>
`.trim(),

  ExportPlugin: `
<h2>Export</h2>
<p>Use Tools → Export to download HTML, Markdown, or JSON of the current document.</p>
<p>Short focused content keeps the export preview readable.</p>
`.trim(),

  HTMLViewerPlugin: `
<h2>HTML viewer</h2>
<p>Open Tools → HTML viewer to inspect the published HTML for this document.</p>
<p>Useful when debugging attrs on atoms and marks.</p>
`.trim(),

  TemplatesPlugin: `
<h2>Templates</h2>
<p>Use Insert → Templates to drop a predefined content snippet into the document.</p>
<p>Replace this stub with a template from the menu.</p>
`.trim(),

  ResponsivePlugin: `
<h2>Responsive preview</h2>
<p>Open Tools → Responsive to preview content at different viewport widths.</p>
<p>Resize handles appear when responsive mode is active.</p>
`.trim(),

  LanguagePlugin: `
<h2>Language</h2>
<p>Switch the editor UI locale from Tools → Language.</p>
<p>Toolbar labels update after the locale pack loads.</p>
`.trim(),

  SpellCheckerPlugin: `
<h2>Spell checker</h2>
<p>Toggle Tools → Spell Checker. Misspellings such as <em>mispeled</em> and <em>wrds</em> get underlined.</p>
<p>Right-click a mark for suggestions when the dictionary is loaded.</p>
`.trim(),

  AIAssistantPlugin: `
<h2>AI assistant</h2>
<p>Open Tools → AI assistant to run prompts against the selection (wire your own backend).</p>
<p>This demo shows the chrome; configure the provider in your host app.</p>
`.trim(),

  TrackChangesPlugin: `
<h2>Track changes</h2>
<p>Enable tracking from Review, then edit — insertions and deletions are marked.</p>
<p>Accept or reject changes from the review menu after you make edits.</p>
`.trim(),

  AnchorLinkPlugin: `
<h2 id="demo-section">Anchors</h2>
<p>This heading has id <code>demo-section</code>. Use Insert → Anchor to set ids and jump links.</p>
<p>Link to <a href="#demo-section">this section</a> within the document.</p>
`.trim(),

  JsonPlugin: `
<p>JSON embed — Tree/Raw workspace (same surface as the JSON editor app).</p>
<div data-node="json_embed" data-text="${jsonAttr(JSON.parse(JSON_EMBED_BODY))}"><pre><code class="language-json">${JSON_EMBED_BODY.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</code></pre></div>
`.trim(),

  MarkdownPlugin: `
<p>Markdown embed — dual-pane draft (Apply / blur commits).</p>
<div data-node="md_embed" data-text="${jsonAttr(MD_EMBED_BODY)}"><pre><code class="language-markdown">${MD_EMBED_BODY.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</code></pre></div>
`.trim(),
};

const ESSENTIAL_PLUGINS = new Set(['ToolbarPlugin', 'HistoryPlugin']);

function primaryPluginName(activePlugins) {
  if (!activePlugins || activePlugins.length === 0) {
    return null;
  }
  const focused = activePlugins.filter((name) => !ESSENTIAL_PLUGINS.has(name));
  return focused[0] ?? activePlugins[0] ?? null;
}

function resolveSeedHtml(initialHtml, activePlugins) {
  if (typeof initialHtml === 'string' && initialHtml.trim() !== '') {
    return initialHtml;
  }
  const primary = primaryPluginName(activePlugins);
  if (primary && DEMO_HTML_BY_PLUGIN[primary]) {
    return DEMO_HTML_BY_PLUGIN[primary];
  }
  return DEMO_HTML;
}

function resolvePlugins(activePlugins) {
  if (!activePlugins || activePlugins.length === 0) {
    return createDefaultPlugins({
      image: docsImageUpload,
      fileUpload: docsFileUpload,
    });
  }
  const names = [...activePlugins];
  // Focused demos: only History (undo). Marks / other chrome only if listed explicitly.
  if (!names.includes('HistoryPlugin')) {
    names.unshift('HistoryPlugin');
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
      if (name === 'JsonPlugin') {
        return JsonPlugin({ surface: 'atom', features: { toolbar: true } });
      }
      if (name === 'MarkdownPlugin') {
        return MarkdownPlugin({ surface: 'atom', features: { toolbar: true } });
      }
      if (name === 'ImagePlugin') {
        return ImagePlugin(docsImageUpload);
      }
      if (name === 'FileUploadPlugin') {
        return FileUploadPlugin(docsFileUpload);
      }
      if (name === 'CollaborationPlugin') {
        return CollaborationPlugin({
          serverUrl: 'ws://127.0.0.1:8787/collab',
          token: 'dev',
          // Share URL (?docId=) auto-connects; first visit still uses Start.
          user: { name: 'Docs', color: '#0284c7' },
        });
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
    const focused = Array.isArray(this.activePlugins) && this.activePlugins.length > 0;
    const editor = new Editor(this.$refs.editorContainer, {
      chrome: this.chrome,
      plugins: resolvePlugins(this.activePlugins),
      // Focused plugin demos: no Insert/Review/Tools dropdowns — plugin buttons on the bar.
      ...(focused ? { toolbar: { menus: [] } } : {}),
    });
    const syncPreviewRuntimes = () => {
      if (!this.showResults) {
        return;
      }
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
      if (!this.showResults) {
        return;
      }
      const preview = this.$refs.preview;
      if (preview instanceof HTMLElement) {
        publishRuntimes.unboot(preview);
      }
      this.editorContent = JSON.stringify(editor.getJSON(), null, 2);
      this.previewContent = editor.getPublishedHTML();
      syncPreviewRuntimes();
    };
    editor.on('docChanged', sync);
    editor.setHTML(resolveSeedHtml(this.initialHtml, this.activePlugins));
    sync();
    this.editor = editor;
  },
  props: {
    activePlugins: { default: () => [], type: Array },
    showDescription: { default: true, type: Boolean },
    /** When false, hide Result JSON / Preview / HTML source (plugin pages). Default true for homepage. */
    showResults: { default: true, type: Boolean },
    chrome: { default: 'bar', type: String },
    /** Override seed HTML (wins over DEMO_HTML_BY_PLUGIN / DEMO_HTML). */
    initialHtml: { default: '', type: String },
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
