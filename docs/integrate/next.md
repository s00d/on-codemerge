# Next.js

Embed On-Codemerge in the App Router as a **client-only** component. Persist **JSON** (`getJSON` / `setJSON`), not HTML.

Verified with `create-next-app@15` (App Router) + `on-codemerge@2.0.3` (`next build` + browser smoke).

## Install

```bash
npm install on-codemerge
```

## Minimal example

`EditorClient.tsx` (client component — real working file from the temp app):

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const INITIAL = {
  version: 1 as const,
  doc: {
    type: 'doc' as const,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello from Next.js' }],
      },
    ],
  },
};

export default function EditorClient() {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || editorRef.current) return;

    const editor = new Editor(el, { plugins: createCorePlugins() });
    editor.setJSON(INITIAL);
    editor.on('docChanged', () => {
      const json = editor.getJSON();
      // persist json
    });
    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  return <div ref={hostRef} style={{ minHeight: 300 }} />;
}
```

`page.tsx` must also be a client page (or a client wrapper) if it renders the editor directly:

```tsx
'use client';

import EditorClient from './EditorClient';

export default function Home() {
  return <EditorClient />;
}
```

## Persist

```ts
editor.on('docChanged', () => {
  const json = editor.getJSON();
  // POST / save
});
```

## Gotchas

- Editor needs DOM APIs — keep it in a `'use client'` module.
- `next/dynamic(..., { ssr: false })` **cannot** be used inside a Server Component (Next 15 build error). Put `ssr: false` only inside a Client Component, or just mark the page/wrapper `'use client'` as above.
- Call `editor.destroy()` in the effect cleanup (Strict Mode remounts in dev).
- Import both CSS entry points in the client module.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
