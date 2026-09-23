# SvelteKit

Client-only editor island. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

`src/lib/Editor.svelte` — same as [Svelte](./svelte.md).

`+page.svelte`:

```svelte
<script>
  import Editor from '$lib/Editor.svelte';
</script>

<Editor value="<p>Hello from SvelteKit</p>" />
```

Keep the editor out of SSR path: import the component only from pages that run in the browser, or wrap with `browser` checks / dynamic import:

```svelte
<script>
  import { browser } from '$app/environment';
  import Editor from '$lib/Editor.svelte';
</script>

{#if browser}
  <Editor />
{/if}
```

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- DOM APIs only in the browser — guard with `browser` or `onMount`.
- Destroy on navigate away (`onDestroy` in the component).

## Related

- [Svelte](./svelte.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
