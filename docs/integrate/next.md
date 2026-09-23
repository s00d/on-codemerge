# Next.js

Client-only App Router embed. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

`EditorClient.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export default function EditorClient({
  value = '<p>Hello from Next.js</p>',
  onChange,
}: {
  value?: string;
  onChange?: (html: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || editorRef.current) return;
    const editor = new Editor(el, { plugins: createCorePlugins() });
    editor.setHTML(value);
    editor.on('docChanged', () => onChange?.(editor.getHTML()));
    editorRef.current = editor;
    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  return <div ref={hostRef} style={{ minHeight: 300 }} />;
}
```

`page.tsx` must be a client page (or client wrapper):

```tsx
'use client';
import EditorClient from './EditorClient';
export default function Home() {
  return <EditorClient />;
}
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Keep the editor in `'use client'` modules.
- `next/dynamic(..., { ssr: false })` cannot live in a Server Component (Next 15).
- Destroy in effect cleanup.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
