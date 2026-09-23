# on-CodeMerge Plugins

Plugins register onto the **core-owned toolbar** and use SDK popup / context menu / notify. Prefer `createDefaultPlugins()` or pick factories explicitly.

Document SoT is JSON (`getJSON` / `setJSON`). HTML and Markdown are boundaries (`getHTML` / `setHTML`, `getMarkdown` / `setMarkdown`). Published hydrate: `getPublishedHTML` / `getPublishedDocument`. See [Editor API](/guide/editor) and [SDK reference](/guide/sdk).

## Plugin sets

| Helper                   | Contents                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createDefaultPlugins()` | Full ship set: toolbar marks, history, typography/color/font/link/alignment, lists, block, block-style, table, media (image/video/youtube/file/pdf), code, math, charts, calendar, timer, form builder, comments, mentions, footnotes, footer, shortcuts, export, HTML viewer, templates, responsive, language, AI, track changes, anchor links. **Not** collaboration (opt-in). |
| `createCorePlugins()`    | Lean essentials: Toolbar, History, Typography, Color, Font, Link, Alignment, Lists, Block, Table, Image, CodeBlock, Math, Export, Shortcuts.                                                                                                                                                                                                                                     |

Toolbar overflow menus (`insert` / `review` / `tools`) are registered by **`Editor`**, not by these helpers. See [Authoring plugins — Toolbar](/guide/authoring-plugins#toolbar-bar-vs-menus).

## Plugin overview

### Essential

| Plugin            | Description                                          | Docs                           |
| ----------------- | ---------------------------------------------------- | ------------------------------ |
| **ToolbarPlugin** | Default B/I/U/S mark buttons (chrome is core-owned). | [Details](./toolbar-plugin.md) |

### Text formatting

| Plugin               | Description                       | Docs                               |
| -------------------- | --------------------------------- | ---------------------------------- |
| **FontPlugin**       | Font family, size, and style.     | [Details](./font-plugin.md)        |
| **TypographyPlugin** | Line height, letter spacing, etc. | [Details](./typography-plugin.md)  |
| **ColorPlugin**      | Text and background colors.       | [Details](./color-plugin.md)       |
| **AlignmentPlugin**  | Left, center, right, justify.     | [Details](./alignment-plugin.md)   |
| **BlockStylePlugin** | Class and style editor.           | [Details](./block-style-plugin.md) |

### Content

| Plugin              | Description                                     | Docs                             |
| ------------------- | ----------------------------------------------- | -------------------------------- |
| **BlockPlugin**     | Resizable pane-tree containers (split / stack). | [Details](./block-plugin.md)     |
| **ListsPlugin**     | Ordered and unordered lists.                    | [Details](./lists-plugin.md)     |
| **TablePlugin**     | Tables.                                         | [Details](./table-plugin.md)     |
| **TemplatesPlugin** | Document templates.                             | [Details](./templates-plugin.md) |

### Media

| Plugin                 | Description           | Docs                                 |
| ---------------------- | --------------------- | ------------------------------------ |
| **ImagePlugin**        | Images.               | [Details](./image-plugin.md)         |
| **VideoPlugin**        | Video files.          | [Details](./video-plugin.md)         |
| **YouTubeVideoPlugin** | YouTube embeds.       | [Details](./youtube-video-plugin.md) |
| **FileUploadPlugin**   | File upload / attach. | [Details](./file-upload-plugin.md)   |

### Code and technical

| Plugin               | Description                     | Docs                               |
| -------------------- | ------------------------------- | ---------------------------------- |
| **CodeBlockPlugin**  | Syntax-highlighted code blocks. | [Details](./code-block-plugin.md)  |
| **MathPlugin**       | LaTeX math via KaTeX.           | [Details](./math-plugin.md)        |
| **HTMLViewerPlugin** | Raw HTML view.                  | [Details](./html-viewer-plugin.md) |

### Interactive

| Plugin                | Description        | Docs                                |
| --------------------- | ------------------ | ----------------------------------- |
| **LinkPlugin**        | Hyperlinks.        | [Details](./link-plugin.md)         |
| **ChartsPlugin**      | Charts.            | [Details](./charts-plugin.md)       |
| **FormBuilderPlugin** | Interactive forms. | [Details](./form-builder-plugin.md) |

### Collaboration and communication

| Plugin                  | Description                                  | Docs                                 |
| ----------------------- | -------------------------------------------- | ------------------------------------ |
| **CollaborationPlugin** | Real-time ops sync (opt-in; requires token). | [Details](./collaboration-plugin.md) |
| **CommentsPlugin**      | Comments / annotations.                      | [Details](./comments-plugin.md)      |
| **FootnotesPlugin**     | Footnotes.                                   | [Details](./footnotes-plugin.md)     |

### Utility

| Plugin                 | Description                                | Docs                                 |
| ---------------------- | ------------------------------------------ | ------------------------------------ |
| **HistoryPlugin**      | Undo / redo.                               | [Details](./history-plugin.md)       |
| **ExportPlugin**       | Export (HTML, PDF, …).                     | [Details](./export-plugin.md)        |
| **ShortcutsPlugin**    | Keyboard shortcuts UI.                     | [Details](./shortcuts-plugin.md)     |
| **ResponsivePlugin**   | Responsive layout helpers.                 | [Details](./responsive-plugin.md)    |
| **LanguagePlugin**     | Locale picker UI.                          | [Details](./language-plugin.md)      |
| **SpellCheckerPlugin** | Spell-check (Typo.js + your dictionaries). | [Details](./spell-checker-plugin.md) |

### AI and advanced

| Plugin                | Description           | Docs                                |
| --------------------- | --------------------- | ----------------------------------- |
| **AIAssistantPlugin** | AI assistant.         | [Details](./ai-assistant-plugin.md) |
| **FooterPlugin**      | Editor footer chrome. | [Details](./footer-plugin.md)       |

### Extra

| Plugin                 | Description               | Docs                                 |
| ---------------------- | ------------------------- | ------------------------------------ |
| **CalendarPlugin**     | Calendar / events.        | [Details](./calendar-plugin.md)      |
| **TimerPlugin**        | Countdown / timer blocks. | [Details](./timer-plugin.md)         |
| **PDFEmbedPlugin**     | Embed PDF documents.      | [Details](./pdf-embed-plugin.md)     |
| **MentionsPlugin**     | @mentions.                | [Details](./mentions-plugin.md)      |
| **TrackChangesPlugin** | Track and review changes. | [Details](./track-changes-plugin.md) |
| **AnchorLinkPlugin**   | In-document anchors.      | [Details](./anchor-link-plugin.md)   |

## Usage

```ts
import {
  Editor,
  ToolbarPlugin,
  AlignmentPlugin,
  createDefaultPlugins,
  createCorePlugins,
  TablePlugin,
} from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

// Full set
const editor = new Editor(container, {
  plugins: createDefaultPlugins(),
});

// Lean + extras
const lean = new Editor(container, {
  plugins: [...createCorePlugins(), TablePlugin()],
});

// Explicit
const custom = new Editor(container, {
  plugins: [ToolbarPlugin(), AlignmentPlugin()],
});

// Late registration
lean.use(TablePlugin());
```

There is **no** `editor.remove()` / `editor.getPlugins()` in v2. To change the set, destroy and recreate the editor (plugin `setup` scope disposes on `editor.destroy()`).

```ts
editor.on('docChanged', () => {
  const json = editor.getJSON();
  // persist json
});

editor.setHTML('<p>Hello</p>'); // boundary only
```

### Options at construction

```ts
const editor = new Editor(container, {
  plugins: createDefaultPlugins(),
  history: { maxDepth: 100 },
  locale: 'en',
});
```

## Dependencies

- Toolbar **chrome** is always present (core). `ToolbarPlugin` is optional (marks only).
- `HistoryPlugin` recommended for undo/redo UI.
- `CollaborationPlugin` needs a WebSocket ops server + matching `token` / `COLLAB_TOKEN`.

## Further reading

- [Migration v1 → v2](/guide/migration-v1-to-v2)
- [Authoring plugins](/guide/authoring-plugins)
- [Editor API](/guide/editor)
