## Track Changes Plugin

Toggleable review mode: typed text is marked as insertion, backspace soft-deletes with a deletion mark.

- Toolbar button toggles the mode (Review menu)
- Inserts render with a green highlight (`.tracked-insert`)
- Soft-deleted text stays in the document with strikethrough (`.tracked-delete`) until hard-deleted

### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { Editor, TrackChangesPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(container, {
  plugins: [TrackChangesPlugin()],
});
```

### How It Works

1. Toggle Track Changes in the Review menu
2. Type — new characters get an `insertion` mark via editor stored marks
3. Backspace — characters get a `deletion` mark (strikethrough); backspace again on marked text removes it

### Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['TrackChangesPlugin']" />
