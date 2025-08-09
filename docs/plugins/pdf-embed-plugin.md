## PDF Embed Plugin

Embed PDFs via `<iframe>` with a resizable container.

- Hotkey: `Ctrl+Alt+P`
- Toolbar: button with 📄 icon

### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { HTMLEditor, PDFEmbedPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new PDFEmbedPlugin());
```

### How It Works

1) Click the toolbar button or press the hotkey to open the popup
2) Enter the PDF URL and dimensions → Insert
3) A `.pdf-embed-container` with an `<iframe>` and a resize handle is inserted

Tip: try `https://example.com/sample.pdf` and resize the container.

### Programmatic Example

```javascript
// Open the insert popup programmatically
editor.triggerEvent('pdf-embed');
```

### Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['PDFEmbedPlugin']" />



