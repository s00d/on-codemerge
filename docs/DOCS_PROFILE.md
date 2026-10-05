# DOCS_PROFILE

Product documentation profile for **on-codemerge** (VitePress site).

## Doc root

- `docs/` — VitePress sources (`docs/.vitepress/config.ts`)
- Site sections: `guide/`, `plugins/`, `integrate/`

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

| User need         | Doc                                   |
| ----------------- | ------------------------------------- |
| Home / live demos | `docs/index.md` (+ `HomeEditorsDemo`) |
| Install / API     | `docs/guide/editor.md`                |
| Editors matrix    | `docs/guide/editors.md`               |
| JSON Editor       | `docs/guide/json-editor.md`           |
| Markdown Editor   | `docs/guide/markdown-editor.md`       |
| Code Editor       | `docs/guide/code-editor.md`           |
| Forms Editor      | `docs/guide/forms-editor.md`          |
| Charts Editor     | `docs/guide/charts-editor.md`         |
| Calendar Editor   | `docs/guide/calendar-editor.md`       |
| Tables Editor     | `docs/guide/tables-editor.md`         |
| Mermaid subset    | `docs/guide/mermaid.md`               |
| Document model    | `docs/guide/document-model.md`        |
| Write a plugin    | `docs/guide/authoring-plugins.md`     |
| ViewSpec runtime  | `docs/guide/view.md`                  |
| Plugin catalog    | `docs/plugins/`                       |
| Framework / host  | `docs/integrate/`                     |
| v1 upgrade        | `docs/guide/migration-v1-to-v2.md`    |

## Verify

```bash
pnpm docs:build
pnpm run check
```

## Rules of thumb

- Integrations and per-plugin pages keep their substance; prefer restructuring and fixing drift over deleting recipes.
- Shared install/CSS lives in Guide — plugin pages link there instead of repeating `npm install`.
- Do not document unwired APIs (`EditorOptions.mode` was removed for this reason).
- Live demos mount once on the home page tabs (`HomeEditorsDemo`); `guide/editors.md` is the matrix + launch recipes only.
- JSON / Markdown / Code product surfaces are `guide/{json,markdown,code}-editor.md` — not separate design/phases trees.
- `packages/editor` is a **private** workspace package (shared Editor facade + source contour). Public docs cite product entries (`on-codemerge`, `on-codemerge/code`, …), not `@codemerge/editor` as an npm import.
