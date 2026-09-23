# Integrate

Step-by-step guides for embedding On-Codemerge in apps and hosts. The editor is browser JS: backends typically **serve static assets** and **persist JSON** from `getJSON()` / `setJSON()`.

Install and CSS once: [Editor API — Getting Started](/guide/editor#getting-started). Prefer JSON as source of truth; HTML (`getHTML` / `setHTML`) and Markdown (`getMarkdown` / `setMarkdown`) are boundaries for paste / export / SSR. Published pages: `getPublishedDocument()`. SDK surface: [SDK reference](/guide/sdk).

Upgrading from 1.x: [Migration v1 → v2](/guide/migration-v1-to-v2).

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

| Guide                   | Stack             |
| ----------------------- | ----------------- |
| [Next.js](./next.md)    | Next.js           |
| [Nuxt 3 / 4](./nuxt.md) | Nuxt (ClientOnly) |

## Backend

Each guide shows how to serve the editor and save/load document JSON (or HTML boundary where noted).

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

| Guide                     | Stack                                |
| ------------------------- | ------------------------------------ |
| [Flutter](./flutter.md)   | `flutter_inappwebview` + JSON bridge |
| [Electron](./electron.md) | Electron + Vite renderer             |

## Shared expectations

- CSS: `on-codemerge/index.css` + `on-codemerge/public.css` (optional a-la-carte plugin CSS + `on-codemerge/sdk.css`)
- Plugins: examples often use `createCorePlugins()` (lean essentials) plus extras you need — or `createDefaultPlugins()` for the full set. See [Plugins overview](/plugins/).
- Persist: `editor.on('docChanged', () => { … editor.getJSON() })`
- Localization: `await editor.setLocale('…')`
