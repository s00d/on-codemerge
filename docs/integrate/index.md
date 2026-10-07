# Integrate

Embed On-Codemerge with **`@codemerge/integrate`** (+ peer `on-codemerge`).

```bash
npm install on-codemerge @codemerge/integrate
```

**UI guides** show framework state → `value` / `onChange` only. Packs, upload, and document IO live in shared pages below.

CSS loads with UI entries (`/react`, `/element`, `/mount`, …). Root import is host API only. Explicit: `import '@codemerge/integrate/styles'`. Not pulled by `/protocol`.

**Aliases (same runtime as the target):** `/preact` `/angular` `/solid` `/qwik` `/backbone` → `/mount`; `/lit` `/astro` → `/element`; `/remix` → `/react`; `/vanilla` → root.

## Start here

| Guide                                    | When                                      |
| ---------------------------------------- | ----------------------------------------- |
| [React](./react.md) / [Vue 3](./vue3.md) | pass value + watch changes                |
| [Host config](./host-config.md)          | plugins pack, upload, locale, collab      |
| [Persistence](./persistence.md)          | document load/save (`bindPersistence`)    |
| [Server + Vite](./server-vite.md)        | Laravel / Slim / Express / … + WC         |
| [Meta SSR](./meta-ssr.md)                | Next / Nuxt / SvelteKit / … (client only) |
| [Native bridge](./native-bridge.md)      | iframe / Flutter / Tauri postMessage      |
| [Chrome & host](./chrome-and-host.md)    | `chrome`, portals, raw `Editor`           |

Per-stack pages are **short deltas** — they link back to the family guides above.

## Quick React example

```tsx
import { useState } from 'react';
import { CodeMergeEditor } from '@codemerge/integrate/react';

export function App() {
  const [html, setHtml] = useState('<p></p>');
  return <CodeMergeEditor value={html} onChange={setHtml} />;
}
```

## Advanced

Raw `new Editor` + `createCorePlugins()` — [Chrome & host](./chrome-and-host.md), [Editor API](/guide/editor).
