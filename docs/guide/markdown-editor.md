# Markdown Editor

Dual-pane Markdown product (`on-codemerge/markdown`): source on the left, sanitized HTML preview on the right. **Source of truth is a prose JSON tree** (`getJSON` / `setJSON`). Markdown and HTML are interchange boundaries (`getText` / `setText`, `getHTML` / `setHTML`).

<script setup>
import MarkdownEditorComponent from '../components/MarkdownEditorComponent.vue';
</script>

<MarkdownEditorComponent :showDescription="false" />

## Launch

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/markdown';

const editor = new Editor(document.getElementById('md-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('# Hello\n');
editor.on('docChanged', () => {
  console.log(editor.getJSON());
  console.log(editor.getText());
  console.log(editor.getHTML());
});
```

## Notes

- SoT is a prose `doc` (paragraph, heading, lists, `callout`, `mermaid`, …) — same kernel model as WYSIWYG, MD-shaped subset. Legacy `doc → markdown.text` blob is rejected.
- Live preview projects HTML **from `state.doc`** (`projectPreviewHtml`) — no second Markdown parse on each keystroke. Source-editor debounce is the only MD→tree path; preview paint is coalesced separately so typing stays responsive.
- **Remote preview:** `preview: { url, headers?, debounceMs? }` POSTs `{ markdown }` and paints returned `text/html` in the right pane (server owns custom blocks). Local projector remains the default; `getHTML` / publish stay local. See [Markdown Plugin](/plugins/markdown-plugin#remote-preview-preview).
- Desktop: drag the middle **gutter** (or ←/→ when focused) to resize source vs preview; double-click resets to 50/50.
- Toolbar **Insert** / **Turn into** mutate kernel state (`insert_node` / `set_attrs`); CM reserializes from SoT.
- **Custom callouts:** `elements: [{ id, label, toPreviewHtml }]` (merged with info/warn/error) — auto Insert / Turn into entries.
- **Custom toolbar:** `toolbar: { menus?, items? }` — sole source of domain bar buttons (`command` / `run`). Omit → `defaultMdToolbar({ elements })`. Undo/redo toolbar is built into the editor. Empty bar → `{ menus: [], items: [] }` (see [Markdown Plugin](/plugins/markdown-plugin)).
- `getHTML` uses the same projector as the right pane; mermaid hosts hydrate to inline SVG (`data-node="mermaid"`) through `@codemerge/mermaid` (subset — may differ from upstream Mermaid; see [Mermaid](/guide/mermaid)). `setHTML` converts HTML → Markdown (lossy) then `setText`.
- `getMarkdown` / `setMarkdown` stay stubs — use `getText` / `setText` for Markdown interchange.
- WYSIWYG embeds use `MarkdownPlugin({ surface: 'atom' })` and register **only** `md_embed` (no prose node collision with Typography).

Compare surfaces: [Editors](/guide/editors).

## Custom toolbar

`toolbar` replaces the default preset (same idea as picking plugins in WYSIWYG). Extend the preset explicitly:

```ts
import {
  Editor,
  createMdElementRegistry,
  defaultMdToolbar,
  runInsertMarkdown,
} from 'on-codemerge/markdown';

const elements = [
  {
    id: 'tip',
    label: 'Tip',
    toPreviewHtml: (block, bodyHtml) =>
      `<aside class="ocm-md-callout" data-node="callout">${bodyHtml}</aside>`,
  },
];
const registry = createMdElementRegistry(elements);
const base = defaultMdToolbar({ elements: registry });

new Editor(host, {
  chrome: 'bar',
  elements,
  toolbar: {
    menus: [...(base.menus ?? []), { id: 'md-tools', label: 'Tools', order: 20 }],
    items: [
      ...(base.items ?? []),
      {
        id: 'md-stamp',
        label: 'Stamp',
        menu: 'md-insert',
        run: runInsertMarkdown(() => `<!-- stamped -->\n`),
      },
      {
        id: 'md-normalize',
        label: 'Normalize',
        menu: 'md-tools',
        run: ({ editor }) => {
          editor.setText(`${editor.getText().trim()}\n`);
        },
      },
    ],
  },
});
```
