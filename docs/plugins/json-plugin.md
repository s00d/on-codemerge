# JSON Plugin

`JsonPlugin` is the shared JSON surface for both editors:

- **WYSIWYG (`surface: 'atom'`)** — Insert menu embeds a `json_embed` atom with the **same Tree/Raw workspace** as the JSON Editor. Shipped in `createDefaultPlugins()`.
- **JSON app (`surface: 'workspace'`)** — Tree + Raw workspace that owns the document (`on-codemerge/json`).

## Demo (WYSIWYG embed)

Live Tree/Raw block (same surface as the JSON Editor). Toggle Tree/Raw in the atom header; **Insert → JSON** / `Mod-Alt-J` adds another.

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['JsonPlugin']"
  :showDescription="false"
  :showResults="false"
/>

> Full JSON-only app: [JSON Editor](/guide/json-editor) · compare surfaces: [Editors](/guide/editors).

## Basic usage

### Atom (inside WYSIWYG)

```ts
import { Editor, JsonPlugin, createDefaultPlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

// Included in createDefaultPlugins() as JsonPlugin({ surface: 'atom' })
const editor = new Editor(host, {
  plugins: createDefaultPlugins(),
});

// Or alone:
new Editor(host, {
  plugins: [JsonPlugin({ surface: 'atom', features: { toolbar: true } })],
});

editor.command('insertJsonEmbed');
```

Document node: `json_embed` atom with `{ text: string }`. In the editor: live Tree/Raw workspace. **Preview (published HTML)** / `getPublishedHTML()`: static card with universal structural highlight.

### Workspace (JSON-only app)

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/json';

const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // JsonPlugin({ surface: 'workspace', … })
});

editor.setText('{"hello":true}');
console.log(editor.getText());
```

## Options

```ts
JsonPlugin({
  surface: 'workspace' | 'atom', // default 'atom'
  /** Sole source of workspace bar buttons. Omit → defaultJsonToolbar(). */
  toolbar?: { menus?: …; items?: … },
  /** Atom Insert placement (`PluginToolbarOpts`). `menu: null` → bar. */
  menu?: string | null,
  group?: string,
  order?: number,
  features?: {
    toolbar?: boolean; // Insert embed (atom only); default true
    rawPane?: boolean; // Raw source editor (workspace)
    treeChrome?: boolean; // tree context menu (workspace)
    shortcuts?: boolean; // shortcuts popup + Mod-/ (workspace)
  },
});
```

Workspace bar buttons never come from feature flags — configure `toolbar` (or use `defaultJsonToolbar` / `createDefaultPlugins()`). Context menu / hotkeys still use `features`. Atom chrome never runs on `surface: 'workspace'`; atom Insert uses `menu` / `group` / `order`.

### Custom toolbar

```ts
import { defaultJsonToolbar } from 'on-codemerge/json';

const base = defaultJsonToolbar();
JsonPlugin({
  surface: 'workspace',
  toolbar: {
    menus: base.menus,
    items: [
      ...(base.items ?? []),
      {
        id: 'json-ping',
        label: 'Ping',
        menu: 'json',
        run: ({ editor }) => editor.notify('ok'),
      },
    ],
  },
});
```

## Commands

| Command                                    | Surface   | Role                     |
| ------------------------------------------ | --------- | ------------------------ |
| `insertJsonEmbed`                          | atom      | Insert `json_embed` atom |
| `insertProperty` …                         | workspace | Structural Tree edits    |
| `json.formatPretty` / `json.formatCompact` | workspace | Indent on JSON root      |

## Keyboard

| Shortcut                      | Surface   | Command           |
| ----------------------------- | --------- | ----------------- |
| `Mod-Alt-J`                   | atom      | `insertJsonEmbed` |
| `Mod-Shift-F` / `Mod-Shift-C` | workspace | format            |
| `Mod-/`                       | workspace | shortcuts help    |
