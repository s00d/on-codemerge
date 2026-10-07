# Remix

Client-only editor — [Meta SSR](./meta-ssr.md). `@codemerge/integrate/remix` is an alias of `/react` (`CodeMergeEditor`).

```tsx
import { useState } from 'react';
import { CodeMergeEditor } from '@codemerge/integrate/remix';

export default function PageEditor() {
  const [html, setHtml] = useState('<p></p>');
  return <CodeMergeEditor value={html} format="html" onChange={setHtml} />;
}
```

Mount only in a client route / `ClientOnly` boundary — same rules as [React](./react.md). Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
