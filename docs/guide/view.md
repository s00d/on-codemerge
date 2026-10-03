# `@codemerge/view`

Tiny zero-dependency DOM runtime: hyperscript `h`, `mount`, portals, file helpers, and `DisposableScope` — without the editor kernel or plugin chrome.

Install standalone:

```bash
pnpm add @codemerge/view
```

Product / SDK re-exports (same API): `on-codemerge/view`, and `@codemerge/sdk` / `on-codemerge/sdk` still export `h` / `mount` / portals for plugins. Prefer `@codemerge/view` when you only need DOM helpers.

```ts
import { h, mount, teleport } from '@codemerge/view';

const host = document.querySelector('#app')!;
const handle = mount(
  host,
  h('div', { class: 'panel' }, [
    h('button', { attrs: { type: 'button' }, on: { click: () => alert('hi') } }, 'Click'),
    teleport('popup', h('div', { class: 'toast' }, 'Hello')),
  ])
);

// later
handle.update(h('div', { class: 'panel' }, 'Done'));
handle.destroy();
```

Modules under `packages/view/src/`: `types`, `h`, `mount`, `files`, `portal`, `disposable`.

Keep toolbar / popup / plugin APIs in `@codemerge/sdk`. Import view primitives from `@codemerge/view` when you only need DOM helpers.
