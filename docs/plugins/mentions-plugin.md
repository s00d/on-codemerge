## Mentions Plugin

User mentions triggered by `@` with a dropdown of suggestions.

- Type `@name` → a dropdown appears
- Click an item → inserts a non-editable `.mention` chip

### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { HTMLEditor, MentionsPlugin } from 'on-codemerge';

const editor = new HTMLEditор(container);
editor.use(new MentionsPlugin([
  { id: '1', label: 'Alice' },
  { id: '2', label: 'Bob' },
  { id: '3', label: 'Charlie' }
]));
```

### How It Works

- Type `@a` → pick from the dropdown → `@Alice` is inserted as `.mention`

### Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['MentionsPlugin']" />



