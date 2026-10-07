# Meta-frameworks (SSR / CSR)

Next, Nuxt, SvelteKit, Remix, Astro: mount the editor **only on the client**. Binding is the same as the UI family ([React](./react.md), [Vue 3](./vue3.md), …) — state in, `onChange` out.

## Next.js

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

## Nuxt / SvelteKit / Remix / Astro

- Mount only on the client: `<ClientOnly>`, `browser`, or `client:only`.
- Real SSR helpers: `@codemerge/integrate/next`, `/nuxt`, `/sveltekit`.
- Aliases (not helpers): `/remix` → `/react`, `/astro` → `/element` (`<ocm-editor>`).
- Wire `value` + `onChange` like the UI family guide ([React](./react.md), [Vue 3](./vue3.md), …).

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
