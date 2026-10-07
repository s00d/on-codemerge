# Astro

Client island for the editor. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

`src/components/EditorIsland.tsx` (React island — or use Svelte/Solid islands the same way):

```tsx
import { useEffect, useRef } from 'react';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export default function EditorIsland() {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const editor = new Editor(el, { plugins: createCorePlugins() });
    editor.setHTML('<p>Hello from Astro</p>');
    return () => editor.destroy();
  }, []);
  return <div ref={hostRef} style={{ minHeight: 300 }} />;
}
```

`src/pages/index.astro`:

```astro
---
import EditorIsland from '../components/EditorIsland';
---
<EditorIsland client:only="react" />
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Use `client:only` (not `client:load`) so SSR never touches the editor DOM.
- Import CSS from the island module or the page frontmatter.

## Related

- [React](./react.md)
- [Svelte](./svelte.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
