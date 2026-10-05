# on-codemerge demo

pnpm stand against the **published package**: WYSIWYG, JSON, Markdown, Code, Forms, Charts, Calendar, Tables.

This folder is pnpm-only (`pnpm install` / `pnpm dev` / `pnpm test:e2e`). Do not use the npm CLI.

## From the public registry

```bash
cd demo
pnpm add on-codemerge@2.7.3
pnpm exec playwright install chromium   # once
pnpm dev                                # http://localhost:3001
```

## From monorepo (local `dist` only)

Not for release verification. Build the package at the repo root first (`pnpm run build`), then:

```bash
cd demo
pnpm add on-codemerge@file:..
pnpm dev
```

E2E: `pnpm build && pnpm test:e2e`
