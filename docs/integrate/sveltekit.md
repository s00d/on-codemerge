# SvelteKit

Client-only editor — [Meta SSR](./meta-ssr.md). Prefer SFC from [Svelte](./svelte.md), or `browser` + `mountCodeMergeEditor` from `@codemerge/integrate/sveltekit` (returns `null` on SSR).

```svelte
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { browser, mountCodeMergeEditor } from '@codemerge/integrate/sveltekit';
  import type { EditorHostHandle } from '@codemerge/integrate';

  let el: HTMLDivElement;
  let html = '<p></p>';
  let host: EditorHostHandle | null = null;

  onMount(() => {
    if (!browser) return;
    host = mountCodeMergeEditor(el, {
      value: html,
      onChange: (v) => {
        html = v;
      },
    });
  });

  onDestroy(() => host?.destroy());
</script>

{#if browser}
  <div bind:this={el} style="min-height:300px"></div>
{/if}
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
