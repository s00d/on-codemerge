# DOCS_PROFILE

Product documentation profile for **on-codemerge** (VitePress site).

## Doc root

- `docs/` — VitePress sources (`docs/.vitepress/config.ts`)
- Site sections: `guide/`, `plugins/`, `integrate/`, `v1/` (HTMLEditor archive)

## Code roots (truth for drift checks)

- `packages/kernel` — document / ops model (`on-codemerge/kernel`)
- `packages/sdk` — `definePlugin`, UI services (`on-codemerge/sdk`)
- `packages/editor` — shared Editor facade + platform (`createShellView`)
- `plugins/` — product plugins (prose + `JsonPlugin`); imported by apps
- `apps/wysiwyg` — CE view (`createCeView`), HTML/MD IO, thin plugin barrel (public `on-codemerge` / `./app`)
- `apps/json` — thin shell + `JsonPlugin({ surface: 'workspace' })` (`on-codemerge/json`)
- `collaboration-server/` — sample ops WebSocket server

## Entry points

| User need        | Doc                                |
| ---------------- | ---------------------------------- |
| Install / API    | `docs/guide/editor.md`             |
| JSON Editor      | `docs/guide/json-editor.md`        |
| Document model   | `docs/guide/document-model.md`     |
| Write a plugin   | `docs/guide/authoring-plugins.md`  |
| Plugin catalog   | `docs/plugins/`                    |
| Framework / host | `docs/integrate/`                  |
| v1 upgrade       | `docs/guide/migration-v1-to-v2.md` |
| v1 archive       | `docs/v1/`                         |

## Verify

```bash
pnpm docs:build
pnpm run check
```

## Rules of thumb

- Integrations and per-plugin pages keep their substance; prefer restructuring and fixing drift over deleting recipes.
- Shared install/CSS lives in Guide — plugin pages link there instead of repeating `npm install`.
- Do not document unwired APIs (`EditorOptions.mode` was removed for this reason).
- JSON product surface is `guide/json-editor.md` + home demo — not a separate design/phases tree.
