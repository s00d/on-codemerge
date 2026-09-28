# on-codemerge demo

Стенд на пакете: три режима — **WYSIWYG** (`on-codemerge`), **JSON** (`on-codemerge/json`), **Markdown** (`on-codemerge/markdown`).

## Из monorepo (локальный `dist`)

Сначала собери пакет в корне, затем:

```bash
# repo root
pnpm run build

cd demo
pnpm add on-codemerge@file:..
pnpm exec playwright install chromium   # один раз
pnpm dev                                # http://localhost:3001
```

## С npm (после publish)

```bash
cd demo
pnpm add on-codemerge@2.1.0
pnpm dev
```

E2E: `pnpm build && pnpm test:e2e`
