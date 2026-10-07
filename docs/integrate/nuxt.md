# Nuxt 3 / 4

Embed behind `<ClientOnly>`. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

`app/components/OcmEditor.client.vue` (Nuxt 4 `app/` layout — put components under `app/components/`):

```vue
<template>
  <div ref="host" style="min-height: 300px" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const host = ref<HTMLElement | null>(null);
let editor: Editor | null = null;

onMounted(() => {
  if (!host.value) return;
  editor = new Editor(host.value, { plugins: createCorePlugins() });
  editor.setHTML('<p>Hello from Nuxt</p>');
  editor.on('docChanged', () => {
    const html = editor!.getHTML();
    // persist html
  });
});

onBeforeUnmount(() => {
  editor?.destroy();
  editor = null;
});
</script>
```

```vue
<template>
  <ClientOnly>
    <OcmEditor />
    <template #fallback><p>Loading…</p></template>
  </ClientOnly>
</template>
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
