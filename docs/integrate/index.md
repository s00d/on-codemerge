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
| [Svelte](./svelte.md)        | Svelte     |
| [Solid.js](./solid.md)       | Solid      |
| [Preact](./preact.md)        | Preact     |
| [Lit](./lit.md)              | Lit / WC   |
| [Qwik](./qwik.md)            | Qwik       |
| [jQuery](./jquery.md)        | jQuery     |
| [Alpine.js](./alpine.md)     | Alpine     |
| [Backbone.js](./backbone.md) | Backbone   |

## Meta-frameworks

| Guide                       | Stack                |
| --------------------------- | -------------------- |
| [Next.js](./next.md)        | Next.js              |
| [Nuxt 3 / 4](./nuxt.md)     | Nuxt (`ClientOnly`)  |
| [SvelteKit](./sveltekit.md) | SvelteKit            |
| [Remix](./remix.md)         | Remix / React Router |
| [Astro](./astro.md)         | Astro islands        |

## Backend — Node / edge

| Guide                      | Stack                |
| -------------------------- | -------------------- |
| [Express.js](./express.md) | Express              |
| [NestJS](./nestjs.md)      | NestJS               |
| [Fastify](./fastify.md)    | Fastify              |
| [Hono](./hono.md)          | Hono (Node/Bun/edge) |
| [Koa](./koa.md)            | Koa                  |
| [Bun](./bun.md)            | Bun                  |
| [Deno](./deno.md)          | Deno                 |
| [AdonisJS](./adonis.md)    | AdonisJS             |

## Backend — Python

| Guide                             | Stack    |
| --------------------------------- | -------- |
| [FastAPI](./fastapi.md)           | FastAPI  |
| [Django](./django.md)             | Django   |
| [Python Flask](./python-flask.md) | Flask    |
| [Litestar](./litestar.md)         | Litestar |

## Backend — PHP

| Guide                           | Stack       |
| ------------------------------- | ----------- |
| [Laravel](./laravel.md)         | Laravel     |
| [Symfony](./symfony.md)         | Symfony     |
| [Slim](./slim.md)               | Slim        |
| [CakePHP](./cakephp.md)         | CakePHP     |
| [CodeIgniter](./codeigniter.md) | CodeIgniter |

## Backend — Go

| Guide                     | Stack |
| ------------------------- | ----- |
| [Go Gin](./go-gin.md)     | Gin   |
| [Go Echo](./go-echo.md)   | Echo  |
| [Go Fiber](./go-fiber.md) | Fiber |
| [Go Chi](./go-chi.md)     | Chi   |

## Backend — Rust

| Guide                             | Stack     |
| --------------------------------- | --------- |
| [Rust Axum](./rust-axum.md)       | Axum      |
| [Rust Actix-web](./rust-actix.md) | Actix-web |
| [Rust Rocket](./rust-rocket.md)   | Rocket    |
| [Rust Warp](./rust-warp.md)       | Warp      |
| [Rust Poem](./rust-poem.md)       | Poem      |
| [Rust Loco](./rust-loco.md)       | Loco      |

## Backend — JVM / .NET / Elixir / Kotlin

| Guide                                    | Stack              |
| ---------------------------------------- | ------------------ |
| [Spring Boot](./spring.md)               | Java Spring Boot   |
| [Quarkus](./quarkus.md)                  | Quarkus            |
| [Micronaut](./micronaut.md)              | Micronaut          |
| [Kotlin Spring Boot](./kotlin-spring.md) | Kotlin Spring Boot |
| [Ktor](./ktor.md)                        | Ktor               |
| [ASP.NET Core](./aspnet-core.md)         | ASP.NET Core       |
| [Blazor](./blazor.md)                    | Blazor + JS island |
| [Phoenix](./phoenix.md)                  | Elixir Phoenix     |
| [Ruby on Rails](./rails.md)              | Rails              |

## Progressive enhancement

| Guide                  | Stack                |
| ---------------------- | -------------------- |
| [HTMX host](./htmx.md) | HTMX + editor island |

## Hosts / desktop / mobile

| Guide                       | Stack                                   |
| --------------------------- | --------------------------------------- |
| [Flutter](./flutter.md)     | `flutter_inappwebview` + HTML/MD bridge |
| [Electron](./electron.md)   | Electron + Vite renderer                |
| [Tauri](./tauri.md)         | Tauri webview                           |
| [Wails](./wails.md)         | Wails (Go) webview                      |
| [Capacitor](./capacitor.md) | Capacitor native shell                  |

## Shared expectations

- CSS: `on-codemerge/index.css` + `on-codemerge/public.css`
- Plugins: `createCorePlugins()` or `createDefaultPlugins()` — [Plugins overview](/plugins/)
- Load: `editor.setHTML(html)` or `editor.setMarkdown(md)`
- Extract: `editor.getHTML()` / `editor.getMarkdown()` on `docChanged` (or on save)
- Optional kernel: `getJSON` / `setJSON`
- Localization: `await editor.setLocale('…')`
