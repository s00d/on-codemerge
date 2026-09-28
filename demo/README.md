# on-codemerge demo

Stand against the **published** npm package: three modes — **WYSIWYG** (`on-codemerge`), **JSON** (`on-codemerge/json`), **Markdown** (`on-codemerge/markdown`).

## From npm (primary)

```bash
cd demo
pnpm add on-codemerge@2.1.1
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
