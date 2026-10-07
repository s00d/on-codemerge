# Svelte

SFC: `@codemerge/integrate/Editor.svelte`. Or `createEditorHost` from `@codemerge/integrate/svelte`.

## Value + changes

```svelte
<script>
  import Editor from '@codemerge/integrate/Editor.svelte';

  let html = '<p></p>';
</script>

<Editor value={html} format="html" on:change={(e) => (html = e.detail.value)} />
```

With a plain host:

```ts
import { onDestroy, onMount } from 'svelte';
import { createEditorHost } from '@codemerge/integrate/svelte';

let el: HTMLDivElement;
let html = '<p></p>';
let host: ReturnType<typeof createEditorHost> | null = null;

onMount(() => {
  host = createEditorHost(el, {
    value: html,
    onChange: (v) => {
      html = v;
    },
  });
});
onDestroy(() => host?.destroy());
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md). Kit: [SvelteKit](./sveltekit.md).
