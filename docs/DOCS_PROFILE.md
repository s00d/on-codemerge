# DOCS_PROFILE

Product documentation profile for **on-codemerge** (Nuxt + Nuxt Content + Nuxt UI site).

## Doc root

- `docs/` — Nuxt app (`docs/nuxt.config.ts`, private workspace package `on-codemerge-docs`)
- `docs/content/` — pages; numeric prefixes set order and are stripped from URLs; `.navigation.yml` names a section
- Sections: `getting-started/`, `editors/`, `plugins/<group>/`, `integrate/<group>/`, `architecture/`, `changelog` (synced from `CHANGELOG.md`, gitignored)
- `docs/app/components/content/` — live demo components, usable in Markdown as `::editor-component{:active-plugins='["ColorPlugin"]' :show-results='false'}`

## Code roots (truth for drift checks)

- `packages/kernel` — document / ops model (`on-codemerge/kernel`)
- `packages/view` — zero-dep ViewSpec DOM runtime (`@codemerge/view` / `on-codemerge/view`)
- `packages/mermaid` — sync Mermaid-subset SVG (`@codemerge/mermaid`)
- `packages/sdk` — `definePlugin`, UI services (`on-codemerge/sdk`); re-exports view
- `packages/editor` — shared Editor facade + platform (`createShellView`)
- `packages/hunspell` — Hunspell `.aff`/`.dic` engine (`@codemerge/hunspell`; also bundled in `on-codemerge`)
- `plugins/` — product plugins (prose + `JsonPlugin`); imported by apps
- `apps/wysiwyg` — CE view (`createCeView`), HTML/MD IO, thin plugin barrel (public `on-codemerge` / `./app`)
- `apps/json` — thin shell + `JsonPlugin({ surface: 'workspace' })` (`on-codemerge/json`)
- `apps/markdown` — thin shell + `MarkdownPlugin({ surface: 'workspace' })` (`on-codemerge/markdown`)
- `apps/code` — thin shell + `CodeBlockPlugin({ surface: 'workspace' })` (`on-codemerge/code`)
- `apps/forms` — thin shell + `FormBuilderPlugin({ surface: 'workspace' })` (`on-codemerge/forms`)
- `apps/charts` — thin shell + `ChartsPlugin({ surface: 'workspace' })` (`on-codemerge/charts`)
- `apps/calendar` — thin shell + `CalendarPlugin({ surface: 'workspace' })` (`on-codemerge/calendar`)
- `apps/tables` — thin shell + `TablePlugin({ surface: 'workspace' })` (`on-codemerge/tables`)
- `packages/collaboration-server` — authoritative collaboration server (`@codemerge/collaboration-server`)

## Entry points

| User need         | Doc                                                      |
| ----------------- | -------------------------------------------------------- |
| Home / live demos | `docs/app/pages/index.vue` (+ `HomeEditorsDemo`)         |
| Introduction      | `docs/content/1.getting-started/1.introduction.md`       |
| Editors matrix    | `docs/content/1.getting-started/2.editors.md`            |
| Install / API     | `docs/content/1.getting-started/3.editor-api.md`         |
| v1 upgrade        | `docs/content/1.getting-started/4.migration-v1-to-v2.md` |
| Product editors   | `docs/content/2.editors/*.md`                            |
| Plugin catalog    | `docs/content/3.plugins/`                                |
| Framework / host  | `docs/content/4.integrate/`                              |
| Model, SDK, view  | `docs/content/5.architecture/`                           |

## Verify

```bash
pnpm docs:build
pnpm run check
```

## Rules of thumb

- Integrations and per-plugin pages keep their substance; prefer restructuring and fixing drift over deleting recipes.
- Shared install/CSS lives in Getting started — plugin pages link there instead of repeating install snippets.
- This repo is pnpm-only (`pnpm install` / `pnpm run …` / `pnpm run release`). Do not document npm CLI for maintainers.
- Do not document unwired APIs (`EditorOptions.mode` was removed for this reason).
- Live demos mount once on the home page tabs (`HomeEditorsDemo`); `getting-started/editors` is the matrix + launch recipes only.
- Product surfaces are `editors/{json,markdown,code,forms,charts,calendar,tables}` — not separate design/phases trees.
- `packages/editor` is a **private** workspace package (shared Editor facade + source contour). Public docs cite product entries (`on-codemerge`, `on-codemerge/code`, …), not `@codemerge/editor` as a published import.
