# on-codemerge demo

Stand against the **published** npm package: four modes — **WYSIWYG** (`on-codemerge`), **JSON** (`on-codemerge/json`), **Markdown** (`on-codemerge/markdown`), **Code** (`on-codemerge/code`).

## From npm (primary)

```bash
cd demo
pnpm add on-codemerge@2.2.0
pnpm exec playwright install chromium   # once
pnpm dev                                # http://localhost:3001
```

## From monorepo (local `dist` only)

Not for release verification. Build the package at the repo root first, then:

```bash
cd demo
pnpm add on-codemerge@file:..
pnpm dev
```

E2E: `pnpm build && pnpm test:e2e`
