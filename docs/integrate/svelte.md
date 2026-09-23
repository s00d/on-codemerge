# Svelte

Embed On-Codemerge in Svelte 4/5. Load and save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { Editor, createCorePlugins } from 'on-codemerge';
  import 'on-codemerge/index.css';
  import 'on-codemerge/public.css';

  export let value = '<p>Hello from Svelte</p>';
  export let onChange = undefined;

  let host;
  /** @type {import('on-codemerge').Editor | null} */
  let editor = null;

  onMount(() => {
    editor = new Editor(host, { plugins: createCorePlugins() });
    editor.setHTML(value);
    editor.on('docChanged', () => onChange?.(editor.getHTML()));
  });

  onDestroy(() => {
    editor?.destroy();
    editor = null;
  });

  $: if (editor && value !== undefined && editor.getHTML() !== value) {
    editor.setHTML(value);
  }
</script>

<div bind:this={host} style="min-height: 300px"></div>
```

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Destroy in `onDestroy`.
- Compare `getHTML()` before re-applying `value`.
- Import both CSS entry points.

## Related

- [SvelteKit](./sveltekit.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
