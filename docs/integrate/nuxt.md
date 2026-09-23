# Nuxt 3 / 4

Embed On-Codemerge behind `<ClientOnly>` (DOM-only). Persist **JSON** (`getJSON` / `setJSON`), not HTML.

Verified with `nuxi` minimal template (Nuxt 4.5) + `on-codemerge@2.0.3` (`nuxt build` + browser smoke).

## Install

```bash
npm install on-codemerge
```

## Minimal example

With the `app/` directory layout, put the editor in `app/components/` (root `components/` was **not** auto-imported in the smoke).

`app/components/OcmEditor.client.vue`:

```vue
<template>
  <div ref="host" style="min-height: 300px" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const INITIAL = {
  version: 1,
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello from Nuxt' }] }],
  },
};

const host = ref<HTMLElement | null>(null);
let editor: Editor | null = null;

onMounted(() => {
  if (!host.value) return;
  editor = new Editor(host.value, { plugins: createCorePlugins() });
  editor.setJSON(INITIAL);
  editor.on('docChanged', () => {
    const json = editor!.getJSON();
    // persist json
  });
});

onBeforeUnmount(() => {
  editor?.destroy();
  editor = null;
});
</script>
```

`app/app.vue`:

```vue
<template>
  <ClientOnly>
    <OcmEditor />
    <template #fallback>
      <p>Loading editor…</p>
    </template>
  </ClientOnly>
</template>
```

The `.client.vue` suffix + `<ClientOnly>` keeps the editor off the server.

## Persist

```ts
editor.on('docChanged', () => {
  const json = editor.getJSON();
  // POST / save
});
```

## Gotchas

- Use `<ClientOnly>` (and/or `*.client.vue`) — the editor needs `window` / DOM.
- In Nuxt 4 `app/` projects, auto-import looks under `app/components/`. A root-level `components/OcmEditor.client.vue` rendered as an empty `<ocmeditor>` custom element in smoke until moved.
- Destroy in `onBeforeUnmount`.
- Import both CSS entry points in the client component.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
