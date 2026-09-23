# Block Plugin

Inserts a **pane-tree container** atom (`block_container`): stack or split panes you can resize and rearrange via context menu. Not a contenteditable CMS of HTML “blocks” — panes are layout widgets in the JSON document.

## Features

- **Pane trees**: leaf panes and nested horizontal/vertical splits
- **Insert commands**: block container, empty paragraph (“text block”), container alias
- **Context menu**: split, stack, and pane operations on the active container / pane
- **Resize**: click a container to show free-aspect resizers; size stored in atom attrs (`width` / `height`)
- **Toolbar**: Insert menu entry for a new block container
- **Keyboard**: Mod-Alt-N / T / C for insert commands

## Usage

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

```ts
import { Editor, BlockPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [BlockPlugin()],
});

editor.command('insertBlock');
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['BlockPlugin']" />

## Commands

| Command           | Role                                               |
| ----------------- | -------------------------------------------------- |
| `insertBlock`     | Insert `block_container` atom (stack leaf tree)    |
| `insertTextBlock` | Insert an empty paragraph after the current block  |
| `insertContainer` | Same atom as `insertBlock` (container entry point) |

```ts
editor.command('insertBlock');
editor.command('insertTextBlock');
editor.command('insertContainer');
```

## Keyboard shortcuts

| Shortcut    | Command           |
| ----------- | ----------------- |
| `Mod-Alt-N` | `insertBlock`     |
| `Mod-Alt-T` | `insertTextBlock` |
| `Mod-Alt-C` | `insertContainer` |

(`Mod` is Ctrl on Windows/Linux, ⌘ on macOS.)

## Document shape

Atom node `block_container` with attrs roughly:

| Attr               | Meaning                                      |
| ------------------ | -------------------------------------------- |
| `layout`           | Derived layout hint (`stack` / row / column) |
| `tree`             | Serialized pane tree (splits + leaves)       |
| `width` / `height` | Optional pixel size after resize             |

Pane labels and split UI are rendered by the plugin widget (`foreign` + SDK `h` / `mount`). Context menu updates attrs via `wctx.updateAttrs` / editor transactions — there is no separate `deleteBlock` / `mergeBlocks` public command set beyond the menu UI.

## Notes

- Included in `createDefaultPlugins()` and `createCorePlugins()`.
- Depends on core toolbar chrome for the Insert menu entry (`menu: 'insert'`).

## Related

- [Plugins overview](/plugins/)
- [Authoring plugins](/guide/authoring-plugins) — widgets / `foreign`
