# on-codemerge — npm demo stand

Локальный стенд против **пакета с npm** (не против исходников монорепы). Нужен, чтобы руками и через Playwright поймать проблемы install / CSS / API после публикации.

## Быстрый старт (после публикации 2.0.1+)

`demo/` — отдельный consumer (см. `.npmrc`: `ignore-workspace=true`), не workspace-пакет монорепы.

```bash
cd demo
pnpm install                  # тянет on-codemerge@^2.0.1 с registry
pnpm exec playwright install chromium
pnpm dev                      # http://localhost:3001
```

Ручная проверка: тулбар со стилями, Bold / JSON / HTML / Markdown / Published preview, блок `#errors` пустой.

## Если версии ещё нет на npm (локальный pack)

Из корня репозитория или из `demo/`:

```bash
cd demo
pnpm install          # devDeps (vite, playwright)
pnpm run install:local-pack   # build + pack monorepo → pnpm add ./on-codemerge-*.tgz
pnpm dev
```

После публикации можно перейти на registry:

```bash
pnpm run install:npm
```

## E2E (Playwright)

Сначала соберите стенд (нужен установленный `on-codemerge`):

```bash
cd demo
pnpm build
pnpm test:e2e
```

`playwright.config.ts` поднимает `pnpm preview` на порту **4177** и гоняет `e2e/stand.spec.ts`:

- CSS содержит `ocm-toolbar`
- Editor / plugins экспортируются
- setHTML → getHTML / getJSON / getMarkdown / getPublishedDocument
- нет `pageerror` и текста в `#errors`

UI-режим: `pnpm test:e2e:ui`.

## Структура

```
demo/
├── index.html
├── main.ts              # boot Editor from on-codemerge + CSS imports
├── e2e/stand.spec.ts
├── playwright.config.ts
├── scripts/install-local-pack.mjs
├── package.json         # dependency: on-codemerge@^2.0.1
└── README.md
```

## Что смотреть руками

1. Тулбар — кнопки с отступами/ховером (не «голые» иконки в ряд).
2. Таблица из sample HTML — видны границы ячеек.
3. Published preview — iframe с контентом и public-стилями.
4. В мета-плашках: `css: ocm-toolbar OK`, `exports: Editor/plugins OK`.
