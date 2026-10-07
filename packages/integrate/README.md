# `@codemerge/integrate`

Universal host adapters for [on-codemerge](https://www.npmjs.com/package/on-codemerge): UI frameworks, `<ocm-editor>`, persistence, native/iframe bridge.

## Install

```bash
npm install on-codemerge @codemerge/integrate
```

Requires **Node.js ≥ 20** and peer **`on-codemerge`**.

## Quick start (React)

```tsx
import { useState } from 'react';
import { CodeMergeEditor } from '@codemerge/integrate/react';

export function App() {
  const [html, setHtml] = useState('<p></p>');
  return <CodeMergeEditor value={html} onChange={setHtml} />;
}
```

CSS loads with UI entries (`/react`, `/element`, `/mount`, …). Root `@codemerge/integrate` is the host API only:

```ts
import '@codemerge/integrate/styles';
```

## Entrypoints

| Import                                  | Use                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `@codemerge/integrate`                  | `createEditorHost`, `createHostPlugins`, `mountCodeMergeEditor`, types    |
| `/react` · `/vue` · `/vue2` · `/svelte` | Framework UI                                                              |
| `/mount`                                | Shared mount (aliases: `/angular` `/preact` `/solid` `/qwik` `/backbone`) |
| `/element`                              | `<ocm-editor>` (aliases: `/lit` `/astro` — not SSR helpers)               |
| `/protocol`                             | `bindPersistence`, `restPersistence`, `bindHostBridge`                    |
| `/Editor.svelte`                        | Svelte SFC                                                                |
| `/next` · `/nuxt` · `/sveltekit`        | Meta / SSR helpers                                                        |
| `/remix`                                | → `/react`                                                                |
| `/vanilla`                              | → root host API                                                           |

## Persistence

```ts
import '@codemerge/integrate/element';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

const el = document.querySelector('ocm-editor');
el?.addEventListener(
  'ready',
  () => {
    bindPersistence(
      el,
      restPersistence({
        url: '/your-endpoint',
        parse: (data) => data.content,
        serialize: (value) => ({ content: value }),
      })
    );
  },
  { once: true }
);
```

## Docs

https://s00d.github.io/on-codemerge/integrate/

## License

MIT — see [LICENSE](./LICENSE).
