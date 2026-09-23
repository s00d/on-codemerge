# React

> Archive: v1 API. Current guides: [Integrate](/integrate/).

Boot **HTMLEditor** on a host element, register plugins, import CSS.

## Example

```tsx
import { useEffect, useRef } from 'react';
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export function Editor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const editor = new HTMLEditor(ref.current);
    editor.use(new ToolbarPlugin());
    return () => editor.destroy();
  }, []);
  return <div ref={ref} />;
}
```
