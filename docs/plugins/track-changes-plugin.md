## Track Changes Plugin

Edit mode that highlights new inserts (demo-level scaffold).

- Toolbar button 📝 toggles the mode
- When enabled, new inserts are temporarily highlighted

### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { HTMLEditor, TrackChangesPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TrackChangesPlugin());
```

### How It Works

1) Toggle the mode with the 📝 button
2) Type/edit content — inserted fragments get highlighted briefly

Note: this is a scaffold for future features (comments on changes, approve/revert).

### Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['TrackChangesPlugin']" />


