# Preact

`@codemerge/integrate/preact` is an alias of `/mount` (`mountCodeMergeEditor` + CSS). No Preact-specific component.

## Value + changes

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import { mountCodeMergeEditor } from '@codemerge/integrate/preact';
import type { EditorHostHandle } from '@codemerge/integrate/preact';

export function PageEditor() {
  const el = useRef<HTMLDivElement>(null);
  const hostRef = useRef<EditorHostHandle | null>(null);
  const [html, setHtml] = useState('<p></p>');

  useEffect(() => {
    if (!el.current) return;
    hostRef.current = mountCodeMergeEditor(el.current, {
      value: html,
      onChange: setHtml,
    });
    return () => {
      hostRef.current?.destroy();
      hostRef.current = null;
    };
  }, []);

  useEffect(() => {
    hostRef.current?.setValue(html);
  }, [html]);

  return <div ref={el} style={{ minHeight: 300 }} />;
}
```

Or `@codemerge/integrate/react` under `preact/compat`. Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
