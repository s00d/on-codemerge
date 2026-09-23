# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
