# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.7.3] - 2026-10-05

### Added

- Tables cell edit: multiline textarea (`Shift+Enter` newline); HTML/GFM emit `<br>`; `getMarkdown` / `setMarkdown` (`getMd` / `setMd`) on the tables editor
- Sheet rows grow with wrapped cell lines; HTML preview cells are `min-height` so `<br>` is not clipped

### Fixed

- Docs tables host: bottom-right resize grip (native SE ticks, translucent)
- Cell click starts edit and focuses the field (dark theme uses accent/input tokens, not sky-50)
- Enter commits and opens the next row for typing; quoted TSV paste keeps newlines inside a cell

## [2.7.2] - 2026-10-05

### Fixed

- Stretch fit no longer overflows horizontally (account for row-index + add-column gutters)
- Sheet HTML themes (`table-modern` / `bordered` / `striped`) match the grid look in published CSS + docs preview
- Large tables: sheet extent no longer capped below SoT row count (bottom rows were unreachable)

## [2.7.1] - 2026-10-05

### Added

- Demo stand mode for **Tables** (`on-codemerge/tables`)

### Changed

- Repo tooling docs: install, scripts, and publish are **pnpm-only** (`pnpm run release` does not bump versions)

### Fixed

- Tables HTML preview follows `view.fit`: Stretch fills host width, Fixed keeps stored column widths; toolbar + status chip to switch
- Tables workspace sheet stays in a bounded host (internal scroll); docs demo can be resized vertically

## [2.7.0] - 2026-10-05

### Added

- **Tables Editor** sparse Excel-like sheet (`TableGridDoc` v2): used SoT only, `getHTML()`, rename column headers, add columns on demand (`+` / toolbar / paste)
- WYSIWYG **Insert Table** mounts the same `tableGrid` sheet as a sized, scrollable, resizable prose atom (`Resizer`); HTML/Markdown interchange as `<table>` / GFM
- Shared platform helpers on `@codemerge/sdk` (icons, ColorWell, Resizer, `safeHtml`, `atomPath`) and `@codemerge/view` (`asAttr`, clipboard, `domHtml`); `ParseError` / `parseJsonPayload` on `@codemerge/kernel`

### Changed

- TablePlugin store is a thin cache: mutations in `grid/ops.ts`, viewport window in the view, no ghost columns on the right
- Plugins import platform from `@codemerge/sdk` / `@codemerge/kernel` / `@codemerge/view` (not `@ocm/wysiwyg/utils`)

### Fixed

- Sheet viewport still paints while a cell is being edited, so scroll/resize cannot hide columns behind the row-index gutter

## [2.6.0] - 2026-10-03

### Fixed

- Publish packaging: drop broken `package.json` `imports` (pointed at missing `.ts` sources)

### Changed

- Plugins are private workspace packages (`plugins/*` → `@ocm/*-plugin`, source exports like `@codemerge/editor`; not published)
- Library CSS: virtual `virtual:ocm-package-index.css` auto-collects each plugin `exports["./style.scss"]` → `dist/index.css` (+ `public.css` / `tailwind.css`); JS entries do not side-effect-import styles. `@codemerge/mermaid` types stay external via dts `exclude` / `aliasesExclude`
- Internal TS imports use `@ocm/*-plugin`; barrel `@ocm/plugins`; plugin `exports` `.` / `./*` → `./*.ts` / `./style.scss`; Vite aliases from `plugins/*/package.json`; `sideEffects` trimmed to real assets

### Breaking

- Removed `on-codemerge/plugins/*/style.css` and `on-codemerge/sdk.css` — use `on-codemerge/index.css` (+ `public.css`) and `@codemerge/sdk/sdk.css` when needed

## [2.5.1] - 2026-10-03

### Fixed

- `Editor.destroy()` clears host chrome tokens it applied (`applyHostChrome` / `clearHostChrome`), so remounting on the same host (e.g. page → bar) no longer leaks page chrome layout

## [2.5.0] - 2026-10-03

### Added

- **Calendar Editor** surface: `apps/calendar` → public entry `on-codemerge/calendar` (+ docs Guide / live preview)
- **Forms Editor** / **Charts Editor** surfaces: `on-codemerge/forms`, `on-codemerge/charts` (+ docs Guide / live previews)
- **`@codemerge/view`** — zero-dep ViewSpec DOM runtime (`h` / `mount` / portal / `DisposableScope`); also `on-codemerge/view`
- Opt-in Editor `diagnostics.onMeasure` for dispatch / view.update / toolbar.refresh timings
- **`@codemerge/mermaid`** — sync Mermaid-subset SVG renderer (8 types, typed IR, no CDN fonts); hydrate bundled in `public.js`
- Opt-in plugin surface `on-codemerge/plugins` (individual constructors)
- SDK **studio layout** helpers: `studioPaneTabs`, `syncStudioPanel`, `STUDIO_POPUP_CLASS`, shared `ocm-studio*` chrome (mobile pane tabs)
- Calendar / FormBuilder / Charts dual-surface (`atom` + `workspace`) with shared studio UI, drivers, IO adapters, default toolbars
- Thin ICS import/export for Calendar (JSON `CalendarDoc` remains SoT)
- `ConstrainedEditor` facade for surface apps (fixed root node type)
- Shared `ParseError` / `parseJsonPayload` in `@ocm/wysiwyg/utils/parseSoT`
- History undo/redo toolbar seeded from `@codemerge/editor` (kernel history)
- `check:calendar-export` / `check:calendar-types` gates in `prepublishOnly`
- Per-plugin locale packs wired via `wirePluginLocales` for many plugins

### Changed

- Calendar / Charts / FormBuilder rewritten around payload SoT + driver registries (legacy managers/renderers removed)
- History / Forms / Charts / Calendar popups use shared studio popup class + responsive pane tabs
- Empty default toolbars are no longer applied (avoids blank chrome)
- `createCorePlugins` builds an explicit lean list (no construct-all-then-filter)
- Calendar ICS/JSON import enforces `MAX_CALENDAR_BYTES` (2MB)
- Root `on-codemerge` entry no longer re-exports every plugin constructor (use `createDefaultPlugins` or `on-codemerge/plugins`)

### Breaking

- History chrome is always on via editor seed — there is no `features.historyChrome` / `HistoryChromePlugin`
- Surface `app.ts` public APIs shrunk (Calendar/Charts/Forms/Json/Code/Markdown): prefer Editor + plugin entry points; middleman barrels (`io/index`, `drivers/index`) removed
- `ParseError` for surface text IO lives under `@ocm/wysiwyg/utils/parseSoT` (not re-exported from every plugin `io` barrel)
- Plugin constructors moved off the root entry → `import { XPlugin } from 'on-codemerge/plugins'`
- `mermaid` / `@crafter/mermaid` runtime removed — diagrams render with `@codemerge/mermaid` (subset of types; unsupported → `data-ocm-mermaid-error`)
- `on-codemerge/public-mermaid.js` removed (hydrate lives in `public.js`)

### Fixed

- Docs Calendar preview: export `coerceCalendarDoc` from `apps/calendar` app entry
- Studio desktop layout: avoid `is-studio-hidden` leak at ≥64rem
- `ensureNodeIds` no longer writes `attrs: undefined` for empty attr bags
- Root `require` types for `./forms` / `./charts` / `./calendar` emit `.d.cts`

### Notes

- Publish: `pnpm run release` (includes forms/charts/calendar lib build + export gates)
- Local SPAs: `pnpm dev:forms` / `dev:charts` / `dev:calendar`

## [2.4.0] - 2026-09-30

### Added

- Published low-level packages under **`@codemerge/*`** (product install unchanged: `on-codemerge`):
  - `@codemerge/kernel` — headless doc / ops / selection
  - `@codemerge/sdk` — plugin API + UI primitives (+ `sdk.css`)
  - `@codemerge/hunspell` — spell engine (`NOTICE` in tarball)
  - `@codemerge/collaboration-server` — collaboration server (protocol v2)
- Workspace rename: `@on-codemerge/*` → `@codemerge/*` (internal only)
- `pnpm run build:packages` + release filter order for scoped packages
- pnpm **catalog** for shared dependency versions; internal links use `workspace:^`
- `publint --strict` for every publishable package (`check` → scoped; `publint` / `prepublishOnly` → + root)
- Published package builds: per-package `vite build` via pnpm workspace filters (no tsup / orchestrator scripts)
- **Collab stack rewrite (protocol v2)**
  - Kernel: `ensureNodeIds`, `transformOp` / `rebaseOps`; editor `transaction` event + `dispatch(tr, { source: 'remote' })`
  - `@codemerge/collaboration-server@2.0.0`: TypeScript authoritative op-log, CLI (`serve` / `compact` / `inspect`), embed API, static+JWT auth, SQLite/memory stores, Postgres adapter, Redis fanout, REST, webhooks, presence, comments, versions
  - `CollaborationPlugin`: FSM client, reconnect, offline IndexedDB queue, presence avatars, toolbar sync chip (`align: end`), share URL = `?docId=` only, `getCollaborationHandle`, no dispatch monkey-patch
- SDK toolbar: `align: 'end'` + custom `view` for trailing chrome (MD preview busy + collab status)

### Breaking

- Demo collab protocol v1 (`join`/`ops` + token on every message, `server.js`) removed
- Default WS path is `/collab`; use `CollaborationPlugin({ serverUrl: 'ws://host:8787/collab', getToken })`

### Notes

- `on-codemerge` still **bundles** kernel/sdk/hunspell (Phase A). Do **not** mix standalone `@codemerge/sdk` with `on-codemerge` in one app bundle.
- `@codemerge/editor` and `apps/*` remain **private**; plugins stay inside the monolith.
- Phase B/C (declare deps / Vite externalize) deferred.
- Publish: `pnpm run release` (check + npm publish of scoped packages + root)

## [2.3.0] - 2026-09-30

### Added

- **Media gallery** shared UI for Image / FileUpload: search, refresh, grid/list, delete
- **Image insert modal** with crop before insert; gallery + upload wired through media API
- **Media API helpers** (`list` / `upload` / `delete`) and optional `endpoints.delete` on upload config
- **Markdown remote preview**: busy spinner in toolbar (SDK `ToolbarButton` `align` + `view`)
- **Docs DEV API** (VitePress `configureServer` only): media/files/md-preview against `docs/.vitepress/dev-api/uploads/`

### Changed

- ImagePlugin no longer ships a separate `ImageUploader`; uses FileUpload media stack
- SDK toolbar buttons support end-aligned custom views (e.g. MD preview spinner)

### Fixed

- ChartMenu: clear preview/`setTimeout`/`rAF` on popup dispose (no leftover deferred callbacks)
- `charts-plugin.md`: broken 4-backtick fences that could trip VitePress local-search Shiki WASM (`memory access out of bounds`)

## [2.2.0] - 2026-09-29

### Added

- **Code Editor** surface: `apps/code` → public entry `on-codemerge/code` (+ docs Guide / plugin demos)
- **Source contour** in `@codemerge/editor`: `mountSourceEditor`, shared lexer/highlight (`highlightHtml` / `lex`) — used by CodeBlock, Json raw, Markdown source
- **In-house Hunspell** (`@codemerge/hunspell`): typed `.aff`/`.dic` engine (`createDictionary` → `check` / `suggest`); replaces `typo-js`
- CodeBlock dual-surface (`atom` + `workspace`), IO adapters, chrome toolbar
- Markdown dual-pane: draggable middle gutter + coalesced preview / mermaid salvage
- SpellChecker: typographic apostrophe normalize, locale reload while enabled, Cyrillic-aware suggest alphabet from `.aff` `TRY`
- Source-editor e2e stand + screenshots / stress specs

### Changed

- SpellCheckerPlugin loads dictionaries via `@codemerge/hunspell` (dictionaries still not bundled — pass URL options)
- Removed runtime deps: `typo-js`, CodeMirror packages (source editing is in-house)
- `prepublishOnly` / check gates include `on-codemerge/code` export + hunspell NOTICE attribution (`dist/THIRD_PARTY_NOTICES.txt`)

### Fixed

- Code workspace status counts without banned `textContent` assignment
- Markdown preview lag with many lines (hash + deferred mermaid hydrate)

## [2.1.2] - 2026-09-28

### Fixed

- **Atom host discovery**: CE shells emit `data-ocm-type`; shared `queryAtomHosts()`; Calendar/Timer persist no longer miss remount after side-channel edits (e.g. calendar stayed on «No events» until unrelated text remount)
- Form / CodeBlock host queries aligned with `data-type` / `data-ocm-type`

## [2.1.1] - 2026-09-28

### Fixed

- **Markdown Editor publish IO**: `getPublishedHTML` / `getPublishedJS` / `getPublishedDocument` project preview HTML (mermaid hosts get `data-ocm-runtime="md-mermaid"`)
- Demo stand depends on npm `on-codemerge@2.1.1` again (not `file:..`); published iframe loads local `public.js` when runtimes are needed

## [2.1.0] - 2026-09-28

### Added

- **Multi-surface apps**: `apps/wysiwyg`, `apps/json` (`on-codemerge/json`), `apps/markdown` (`on-codemerge/markdown`) + shared `@codemerge/editor`
- **Declarative WYSIWYG toolbar menus**: `Editor` option `toolbar.menus` / `defaultWysiwygToolbarMenus()`; `{ menus: [] }` → flat bar
- **`PluginToolbarOpts` / `pluginToolbarPlacement`**: optional `menu` / `group` / `order` on insert/review/tools plugin factories (incl. Json/Markdown atom chrome)
- **Typed SoT attrs**: structured `DocNode.attrs` (objects/arrays) with `attrToHtmlValue` / `readJsonAttr` / `coerceHtmlJsonAttr` on the HTML boundary
- **ClearStylesPlugin**: clear marks + block style/align (selection or whole document); `Mod-\`
- Docs: focused plugin demos via `toolbar: { menus: [] }` (no flatten/compact flags); Clear Styles + editors guides

### Changed

- Overflow menus **only** from host `toolbar.menus` (or plugin `defineMenu`); missing menu id → button on the bar
- Charts / Calendar / Timer / Block / BlockStyle / Form / Footnotes SoT parsers unified on `readJsonAttr`; DOM/publish encode via `attrToHtmlValue`
- `CalendarManager.importCalendar` accepts typed payload (string still supported for file import)
- Kernel scale bench budget softened for CI variance

### Removed

- `flattenOverflowMenus`, `defaultOverflowMenus`, docs `compactToolbar` demo hacks

## [2.0.5] - 2026-09-24

### Fixed

- Build: externalize runtime dependencies from `dist` (correct peer/runtime resolution)

## [2.0.4] - 2026-09-23

### Fixed

- Docs/IO: HTML/Markdown as integrate load path; link import + load tests
- Kitchen-sink HTML coverage for element round-trip

## [2.0.3] - 2026-09-23

### Changed

- Branding / screenshots for v2; integrate guide rewrites across stacks
- Toolbar titles refresh on `setLocale`

### Fixed

- Demo published preview with local `public.css`

## [2.0.2] - 2026-09-23

### Fixed

- Patch release after 2.0.1 (docs/demo follow-ups)

## [2.0.1] - 2026-09-23

### Fixed

- **Docs site CSS**: VitePress now loads prebuilt `dist/index.css` + `dist/public.css` so demos get full toolbar / atom chrome (Tailwind content-scan via docs pipeline was incomplete)
- Docs `EditorComponent` imports editor modules without pulling half-processed `src/app` CSS side-effects

### Added

- **`demo/`** npm stand + Playwright smoke (`demo/README.md`) against the published package
- Package export `on-codemerge/package.json` for version probing

## [2.0.0] - 2026-09-23

Breaking rewrite of the editor around a virtual JSON document, SDK plugin surface, and published-page CSS/JS split. See [Migration guide: v1 → v2](docs/guide/migration-v1-to-v2.md).

### Added

- **`on-codemerge/kernel`**: document model, operations, selection, transactions (re-exported from the main package)
- **`on-codemerge/sdk`**: `definePlugin`, ViewSpec UI (`h` / `mount` / portals), popup / toolbar / context-menu / notify
- **`Editor`**: replaces `HTMLEditor`; JSON is source of truth (`getJSON` / `setJSON`); HTML/MD as boundaries via `src/io/`
- **Package CSS**: `on-codemerge/index.css` (editor chrome) + `on-codemerge/public.css` + `on-codemerge/public.js` (published page)
- **Workspace packages**: `@codemerge/kernel` / `@codemerge/sdk` (private; bundled into `on-codemerge`)
- **Vitest** unit + e2e (untestutils / Playwright); `oxlint` + `oxfmt`; locale parity (`check:locales`)
- **Docs**: Guide (`editor`, `sdk`, `document-model`, `authoring-plugins`, migration), Integrate, Plugins catalog
- Redesigned panels: Typography Styles, Font Settings (browser font detect), Block Style Editor (inline ColorWell), Edit History viewer
- Atom alignment via AlignmentPlugin for timer / calendar / form; shared muted atom chrome + left accent stripe
- MathPlugin TeX-subset → AST → MathML (no KaTeX runtime)

### Changed

- Plugins register chrome through SDK only — no plugin-owned toolbar DOM / `document.createElement` (ban script enforced)
- Toolbar chrome owned by Editor / SDK; `ToolbarPlugin()` only registers text marks; overflow menus `insert` / `review` / `tools` registered by core
- Styling: Tailwind v4 + `@apply` in plugin `style.scss`; ColorWell for color UI
- SpellChecker: `typo-js`; dictionaries not bundled — pass Hunspell URLs via options
- i18n: locales under `src/i18n/locales/` (en + lazy locales)
- Tooling: pnpm workspace, Vite 8 library build (`preserveModules` + `ocm-package` post-process), publint gate

### Removed

- **`HTMLEditor`**, old `src/core/` (DOMContext, PopupManager, LocaleManager, TextFormatter, …)
- Per-plugin `public.scss` sprawl and per-plugin CSS package exports — use bundled `index.css` / `public.css`
- `editor.showToolbar` / `hideToolbar` / `addToolbarTool` / `createToolbarButton`
- Jest; Prettier / ESLint configs (replaced by oxfmt / oxlint)
- `ToolbarDividerPlugin` as a real chrome plugin (no-op; separators from toolbar `group`)
- Bundled spellcheck dictionary texts

### Fixed

- Typography Styles modal layout (vertical rows + sectioned CSS in dist)
- Font Settings empty content after remount; `t()` interpolation for available font count
- Block Style color picker closing the parent modal (inline ColorWell)
- Popup close-on-overlay for Font / Block Style / History
- Typed `removeAtomAt` with kernel `Command` (no `as never` at call sites)
- Safe DOM event handling (`instanceof` / guards instead of unsafe casts)
- Chart data validation (empty series / NaN / empty labels); timer payload defaults
- oxlint `--deny-warnings` gate; jsdom canvas `getContext` stub for unit tests

## [1.3.2]

See git history (`chore(package): update version to 1.3.2`).

## [1.1.0] - 2024-12-19

### Added

- AI Assistant, Calendar, Language, Responsive, Timer, Block plugins
- Lazy table support and enhanced Table Plugin commands
- Notification system and plugin documentation
- Localization for 18 languages

### Changed

- Core architecture and shortcuts cleanup
- Charts popup behavior; dark mode styles

## [1.0.28] - 2024-12-19

### Added

- AI Assistant plugin; Selector container parameter

### Fixed

- Hotkeys / code style inconsistencies

## [Previous Versions]

For earlier versions, please refer to the git history and commit messages.

---

## Contributing

When contributing to this project, please update this changelog with your changes following the format above.

### Categories

- **Added**: for new features
- **Changed**: for changes in existing functionality
- **Deprecated**: for soon-to-be removed features
- **Removed**: for now removed features
- **Fixed**: for any bug fixes
- **Security**: in case of vulnerabilities
