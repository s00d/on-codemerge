# Preact

Same pattern as React with Preact hooks. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge preact
```

## Minimal example

```tsx
import { useEffect, useRef } from 'preact/hooks';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export function MyEditor({
  value = '<p>Hello from Preact</p>',
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
  }, []);

  return <div ref={hostRef} style={{ minHeight: 300 }} />;
}
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [React](./react.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
