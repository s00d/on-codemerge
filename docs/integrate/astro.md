# Astro

Client-only island — [Meta SSR](./meta-ssr.md). `/astro` is an alias of `/element` (`<ocm-editor>`), not an SSR helper. Prefer a React/Vue island with `client:only`.

`src/components/PageEditor.tsx`:

```tsx
import { useState } from 'react';
import { CodeMergeEditor } from '@codemerge/integrate/react';

export function PageEditor() {
  const [html, setHtml] = useState('<p></p>');
  return <CodeMergeEditor value={html} format="html" onChange={setHtml} />;
}
```

```astro
---
import { PageEditor } from '../components/PageEditor';
---
<PageEditor client:only="react" />
```

Or `<ocm-editor>` + [Server + Vite](./server-vite.md) / [Persistence](./persistence.md).
