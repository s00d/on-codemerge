# React

Embed On-Codemerge in React. Load and save with **HTML** (or Markdown) — that is the usual integrate path.

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

export function MyEditor({
  value = '<p>Hello from React</p>',
  onChange,
}: {
  value?: string;
  onChange?: (html: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const editor = new Editor(el, { plugins: createCorePlugins() });
    editor.setHTML(value);
    editor.on('docChanged', () => onChangeRef.current?.(editor.getHTML()));
    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === undefined) return;
    if (editor.getHTML() === value) return;
    editor.setHTML(value);
  }, [value]);

  return <div ref={hostRef} style={{ minHeight: 300 }} />;
}
```

```tsx
import { useState } from 'react';
import { MyEditor } from './MyEditor';

export function App() {
  const [html, setHtml] = useState('<p>Initial</p>');
  return <MyEditor value={html} onChange={setHtml} />;
}
```

### Markdown instead of HTML

```ts
editor.setMarkdown('# Title\n\nHello **world**');
editor.on('docChanged', () => {
  const md = editor.getMarkdown();
});
```

### Extract on save

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
// optional kernel snapshot:
const json = editor.getJSON();
```

## Gotchas

- Destroy in effect cleanup (Strict Mode remounts in dev).
- Keep `onChange` in a ref; compare `getHTML()` before re-applying props.
- Import both CSS entry points.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
