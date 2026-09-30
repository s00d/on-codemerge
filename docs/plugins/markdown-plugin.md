# Markdown Plugin

`MarkdownPlugin` is the shared Markdown surface for both editors:

- **WYSIWYG (`surface: 'atom'`)** — registers **only** `md_embed` (no `heading`/lists — those stay on Typography/Lists). Insert menu embeds dual-pane (draft + Apply/blur). Persist attr remains `text`.
- **Markdown app (`surface: 'workspace'`)** — dual-pane workspace; SoT is prose JSON (`callout`, `mermaid`, headings, …). Preview uses `projectPreviewHtml(state.doc)` (no live MD re-parse).

## Demo (WYSIWYG embed)

Live dual-pane block. **Insert → Markdown** / `Mod-Alt-M` adds another. Parent attrs commit on Apply / blur (not live keystroke).

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['MarkdownPlugin']"
  :showDescription="false"
  :showResults="false"
/>

> Full Markdown-only app: [Markdown Editor](/guide/markdown-editor) · compare surfaces: [Editors](/guide/editors).

## Basic usage

### Atom (inside WYSIWYG)

```ts
import { Editor, MarkdownPlugin, createDefaultPlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(host, {
  plugins: createDefaultPlugins(),
});

// Or alone:
new Editor(host, {
  plugins: [MarkdownPlugin({ surface: 'atom', features: { toolbar: true } })],
});
```

### Workspace (Markdown app)

```ts
import { Editor, MarkdownPlugin, emptyEditorDoc } from 'on-codemerge/markdown';

new Editor(host, {
  chrome: 'bar',
  doc: emptyEditorDoc('# Hello\n'),
  plugins: [MarkdownPlugin({ surface: 'workspace' })],
});
```

Toolbar **Insert** / **Turn into** cover headings, lists, mermaid, and callouts:

```md
:::info Title
Body markdown.

@btn[Action](#)
:::
```

Builtins: `info`, `warn`, `error`. Add or override render via `elements`:

```ts
MarkdownPlugin({
  surface: 'workspace',
  elements: [
    {
      id: 'tip',
      label: 'Tip',
      toPreviewHtml: (block, bodyHtml) =>
        `<aside class="ocm-md-callout ocm-md-callout--info" data-node="callout">${bodyHtml}</aside>`,
    },
  ],
});
```

Insert uses kernel `insertMdCallout` (prose SoT), not CM fence snippets.

## Custom toolbar (`toolbar`)

Declarative menus / buttons — **sole source** of workspace chrome (SDK `ToolbarConfig` / `applyToolbarConfig`, same shapes as WYSIWYG `ToolbarButton` / `ToolbarMenuDef`). Omit → `defaultMdToolbar({ elements })`. Empty bar → `{ menus: [], items: [] }`.

Atom surface (`surface: 'atom'`) ignores `toolbar`; place the Insert embed via `PluginToolbarOpts` (`menu` / `group` / `order`, e.g. `menu: null` for a bar button).

```ts
import {
  defaultMdToolbar,
  createMdElementRegistry,
  runInsertMarkdown,
} from 'on-codemerge/markdown';

const registry = createMdElementRegistry([]);
const base = defaultMdToolbar({ elements: registry });

MarkdownPlugin({
  surface: 'workspace',
  toolbar: {
    menus: [...(base.menus ?? []), { id: 'md-tools', label: 'Tools', order: 20 }],
    items: [
      ...(base.items ?? []),
      { id: 'md-stamp', label: 'Stamp', menu: 'md-insert', run: runInsertMarkdown('<!-- x -->\n') },
      { id: 'md-cmd', label: 'Mermaid', menu: 'md-tools', command: 'insertMdMermaid' },
      {
        id: 'md-run',
        label: 'Ping',
        menu: 'md-tools',
        run: ({ editor, workspace }) => {
          editor.notify('ok');
          workspace?.focus();
        },
      },
    ],
  },
});
```

| Field     | Role                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| `command` | SDK `ToolbarButton.command` → `onCommand`                                             |
| `run`     | SDK deferred click (`{ editor, workspace }`) — use `runInsertMarkdown` for CM inserts |

`elements` = callout kinds + preview (fed into `defaultMdToolbar`). Undo/redo = `HistoryChromePlugin` (same ids as HistoryPlugin).

## Remote preview (`preview`)

Workspace-only. When hosts already render Markdown on the server (custom blocks, CMS pipeline), point the right pane at that endpoint instead of shipping every custom element into the editor.

**Default** (omit `preview`): local `projectPreviewHtml` + mermaid hydrate.

**Remote:** trailing-debounced `POST` with JSON `{ markdown }`; response body is raw `text/html` (sanitized at the DOM sink). Local projector / mermaid hydrate are skipped for the pane. `getHTML` / publish stay on the local projector.

```http
POST /api/md-preview
Content-Type: application/json
Accept: text/html

{"markdown":"# Hello\n"}

→ 200 text/html
```

```ts
import { Editor } from 'on-codemerge/markdown';

new Editor(host, {
  chrome: 'bar',
  preview: {
    url: '/api/md-preview',
    headers: { Authorization: 'Bearer …' }, // optional
    debounceMs: 500, // optional, default 500
  },
});
```

Or wire the plugin / factory explicitly:

```ts
createDefaultPlugins({ preview: { url: '/api/md-preview' } });
// or
MarkdownPlugin({
  surface: 'workspace',
  preview: { url: '/api/md-preview', debounceMs: 400 },
});
```

Typing coalesces into one request (abort in-flight on supersede). Identical markdown after a successful paint is not re-fetched. Atom surface ignores `preview`.
