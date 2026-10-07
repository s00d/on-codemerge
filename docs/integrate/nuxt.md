# Nuxt

Client-only editor — [Meta SSR](./meta-ssr.md). UI: [Vue 3](./vue3.md) via `@codemerge/integrate/nuxt` (re-exports `/vue` + `clientOnlyHint()`).

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CodeMergeEditor } from '@codemerge/integrate/nuxt';

const html = ref('<p></p>');

function onChange(value: string) {
  html.value = value;
}
</script>

<template>
  <ClientOnly>
    <CodeMergeEditor :value="html" format="html" @change="onChange" />
  </ClientOnly>
</template>
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
