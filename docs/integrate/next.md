# Next

Client-only editor — [Meta SSR](./meta-ssr.md). UI: [React](./react.md).

```tsx
'use client';

import dynamic from 'next/dynamic';
import { createCodeMergeEditor } from '@codemerge/integrate/next';
import { useState } from 'react';

const CodeMergeEditor = createCodeMergeEditor(
  () => import('@codemerge/integrate/react'),
  dynamic
) as typeof import('@codemerge/integrate/react').CodeMergeEditor;

export default function Page() {
  const [html, setHtml] = useState('<p></p>');
  return <CodeMergeEditor value={html} onChange={setHtml} />;
}
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
