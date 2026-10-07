# Solid.js

Embed On-Codemerge in Solid. Load and save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

```tsx
import { onCleanup, onMount } from 'solid-js';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export function MyEditor(props: { value?: string; onChange?: (html: string) => void }) {
  let host!: HTMLDivElement;
  let editor: Editor | null = null;

  onMount(() => {
    editor = new Editor(host, { plugins: createCorePlugins() });
    editor.setHTML(props.value ?? '<p>Hello from Solid</p>');
    editor.on('docChanged', () => props.onChange?.(editor!.getHTML()));
  });

  onCleanup(() => {
    editor?.destroy();
    editor = null;
  });

  return <div ref={host!} style={{ 'min-height': '300px' }} />;
}
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Destroy in `onCleanup`.
- Prefer a prop signal + explicit `setHTML` when syncing from outside.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
