## Mentions Plugin

User mentions triggered by `@`.

### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { Editor, MentionsPlugin } from 'on-codemerge';

const editor = new HTMLEditор(container);
/* use plugins: [MentionsPlugin()] in Editor(...) */
```

### Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['MentionsPlugin']" />

## Public API (v2)

Factory: `MentionsPlugin(mentions?)` — options: `Mention[] (default DEFAULT_MENTIONS)`.

| Command         |                                   |
| --------------- | --------------------------------- |
| `insertMention` | `editor.command('insertMention')` |

### Keyboard shortcuts

| Shortcut      | Command         |
| ------------- | --------------- |
| `Mod-Shift-2` | `insertMention` |

> **Note:** Editor is `Editor`, not `HTMLEditor`.
