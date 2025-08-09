## Mentions Plugin

User mentions triggered by `@`.


### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { HTMLEditor, MentionsPlugin } from 'on-codemerge';

const editor = new HTMLEditор(container);
editor.use(new MentionsPlugin());
```

### Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['MentionsPlugin']" />



