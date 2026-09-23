# React

Embed On-Codemerge in a React app. Persist **JSON** (`getJSON` / `setJSON`), not HTML.

## Install

```bash
npm install on-codemerge
```

## Minimal example

```tsx
import { useEffect, useRef } from 'react';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

type DocJson = ReturnType<Editor['getJSON']>;

const INITIAL: DocJson = {
  version: 1,
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello from React' }] }],
  },
};

export function MyEditor({
  value = INITIAL,
  onChange,
}: {
  value?: DocJson;
  onChange?: (doc: DocJson) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const editor = new Editor(el, { plugins: createCorePlugins() });
    editor.setJSON(value);
    editor.on('docChanged', () => onChangeRef.current?.(editor.getJSON()));
    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // mount once — sync value in a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !value) return;
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(value)) return;
    editor.setJSON(value);
  }, [value]);

  return <div ref={hostRef} style={{ minHeight: 300 }} />;
}
```

```tsx
import { useState } from 'react';
import { MyEditor } from './MyEditor';

export function App() {
  const [doc, setDoc] = useState({
    version: 1 as const,
    doc: {
      type: 'doc' as const,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial' }] }],
    },
  });

  return <MyEditor value={doc} onChange={setDoc} />;
}
```

## Persist

```ts
editor.on('docChanged', () => {
  const json = editor.getJSON();
  // POST / save to your API
});
```

HTML (`getHTML` / `setHTML`) and Markdown are boundaries (paste / export), not the stored document.

## Gotchas

- Call `editor.destroy()` in the effect cleanup (React Strict Mode remounts in dev).
- Keep `onChange` in a ref so the mount effect does not re-run on every render.
- Compare JSON before `setJSON` from props to avoid feedback loops.
- CSS: both `on-codemerge/index.css` and `on-codemerge/public.css`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
