# on-codemerge demo

Стенд на **опубликованном** npm-пакете: три режима — **WYSIWYG** (`on-codemerge`), **JSON** (`on-codemerge/json`), **Markdown** (`on-codemerge/markdown`).

## С npm (основной путь)

```bash
cd demo
pnpm add on-codemerge@2.1.1
pnpm exec playwright install chromium   # один раз
pnpm dev                                # http://localhost:3001
```

## Из monorepo (только отладка локального `dist`)

Не для проверки релиза. Сначала `pnpm run build` в корне, затем:

```bash
cd demo
pnpm add on-codemerge@file:..
pnpm dev
```

E2E: `pnpm build && pnpm test:e2e`
