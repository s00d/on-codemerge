# Vue 3

`CodeMergeEditor` from `@codemerge/integrate/vue` (CSS auto).

## Install

```bash
npm install on-codemerge @codemerge/integrate
```

## Value + changes

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CodeMergeEditor } from '@codemerge/integrate/vue';

const html = ref('<p></p>');

function onChange(value: string) {
  html.value = value;
}
</script>

<template>
  <CodeMergeEditor :value="html" format="html" @change="onChange" />
</template>
```

`@change` → `(value, format)`. Extra construct options via `:host-options` — [Host config](./host-config.md). Load/save: [Persistence](./persistence.md). Options API: [Vue 2](./vue2.md).
