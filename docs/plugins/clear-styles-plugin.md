# Clear Styles Plugin

Clears visual formatting from the document.

- **No selection (collapsed caret)** → clears styles in the **whole document**
- **Selection** → clears styles only in the selected range

Removes style marks (`bold`, `italic`, `underline`, `strike`, `textColor`, `highlight`, `fontFamily`, `fontSize`) and block attrs (`style`, `align`, `lineHeight`). Links, comments, footnotes, and track-changes marks are left alone.

Markdown workspace has the same control on the domain toolbar (`clearMdStyles` on the source pane).

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['ClearStylesPlugin', 'ColorPlugin', 'FontPlugin', 'AlignmentPlugin']"
  :showDescription="false"
  :showResults="false"
/>

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

```js
import { Editor, ClearStylesPlugin, ToolbarPlugin, HistoryPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';

const editor = new Editor(container, {
  plugins: [ToolbarPlugin(), HistoryPlugin(), ClearStylesPlugin()],
});

editor.command('clearStyles');
```

## Hotkey

`Mod-\` — clear styles (selection or whole document).
