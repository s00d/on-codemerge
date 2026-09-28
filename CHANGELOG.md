# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-09-28

### Fixed

- **Markdown Editor publish IO**: `getPublishedHTML` / `getPublishedJS` / `getPublishedDocument` project preview HTML (mermaid hosts get `data-ocm-runtime="md-mermaid"`)
- Demo stand depends on npm `on-codemerge@2.1.1` again (not `file:..`); published iframe loads local `public.js` when runtimes are needed

## [2.1.0] - 2026-09-28

### Added

- **Multi-surface apps**: `apps/wysiwyg`, `apps/json` (`on-codemerge/json`), `apps/markdown` (`on-codemerge/markdown`) + shared `@on-codemerge/editor`
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
- **Workspace packages**: `@on-codemerge/kernel` / `@on-codemerge/sdk` (private; bundled into `on-codemerge`)
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
