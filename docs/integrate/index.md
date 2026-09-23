# Integrate

Guides for embedding On-Codemerge. Day-to-day apps usually load and save **HTML** (`setHTML` / `getHTML`) or **Markdown** (`setMarkdown` / `getMarkdown`).

JSON (`getJSON` / `setJSON`) is the internal document model — useful for advanced sync / tooling, not the default integrate path.

Install and CSS: [Editor API — Getting Started](/guide/editor#getting-started). Published pages: `getPublishedDocument()`. SDK: [SDK reference](/guide/sdk). Upgrading from 1.x: [Migration v1 → v2](/guide/migration-v1-to-v2).

## Chrome & host

| Guide                                 | Topic                                            |
| ------------------------------------- | ------------------------------------------------ |
| [Chrome & host](./chrome-and-host.md) | `chrome: 'bar' \| 'page'`, portals, hosting tips |

## Frontend

| Guide                        | Stack      |
| ---------------------------- | ---------- |
| [React](./react.md)          | React      |
| [Vue 2](./vue2.md)           | Vue.js 2.x |
| [Vue 3](./vue3.md)           | Vue.js 3.x |
| [Angular](./angular.md)      | Angular    |
| [Backbone.js](./backbone.md) | Backbone   |

## Meta-frameworks

| Guide                   | Stack               |
| ----------------------- | ------------------- |
| [Next.js](./next.md)    | Next.js             |
| [Nuxt 3 / 4](./nuxt.md) | Nuxt (`ClientOnly`) |

## Backend

Each guide focuses on the **editor** (load / edit / extract). Your server only stores the string you choose (HTML or Markdown).

| Guide                                    | Stack              |
| ---------------------------------------- | ------------------ |
| [Express.js](./express.md)               | Node.js Express    |
| [Django](./django.md)                    | Python Django      |
| [Ruby on Rails](./rails.md)              | Rails              |
| [Laravel](./laravel.md)                  | PHP Laravel        |
| [Spring Boot](./spring.md)               | Java Spring Boot   |
| [Symfony](./symfony.md)                  | PHP Symfony        |
| [Slim](./slim.md)                        | PHP Slim           |
| [Python Flask](./python-flask.md)        | Flask              |
| [Go Gin](./go-gin.md)                    | Gin                |
| [Rust Actix-web](./rust-actix.md)        | Actix-web          |
| [Kotlin Spring Boot](./kotlin-spring.md) | Kotlin Spring Boot |

## Hosts

| Guide                     | Stack                                   |
| ------------------------- | --------------------------------------- |
| [Flutter](./flutter.md)   | `flutter_inappwebview` + HTML/MD bridge |
| [Electron](./electron.md) | Electron + Vite renderer                |

## Shared expectations

- CSS: `on-codemerge/index.css` + `on-codemerge/public.css`
- Plugins: `createCorePlugins()` or `createDefaultPlugins()` — [Plugins overview](/plugins/)
- Load: `editor.setHTML(html)` or `editor.setMarkdown(md)`
- Extract: `editor.getHTML()` / `editor.getMarkdown()` on `docChanged` (or on save)
- Optional kernel: `getJSON` / `setJSON`
- Localization: `await editor.setLocale('…')`
