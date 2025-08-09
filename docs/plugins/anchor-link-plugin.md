## Anchor Link Plugin

Insert anchors and links to sections (auto-generate ID from selection if empty).

- The `#` button opens a popup with Anchor ID and Text
- Inserts an `.anchor-link` at the current cursor position

### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { HTMLEditor, AnchorLinkPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new AnchorLinkPlugin());
```

### How It Works

1) Select a phrase in the document
2) Click `#` in the toolbar → fill Anchor ID and Text → Insert

### Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['AnchorLinkPlugin']" />


