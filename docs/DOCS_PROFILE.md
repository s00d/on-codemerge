# DOCS_PROFILE

Product documentation profile for **on-codemerge** (VitePress site).

## Doc root

- `docs/` — VitePress sources (`docs/.vitepress/config.ts`)
- Site sections: `guide/`, `plugins/`, `integrate/`

## Code roots (truth for drift checks)

- `packages/kernel` — document / ops model (`on-codemerge/kernel`)
- `packages/sdk` — `definePlugin`, UI services (`on-codemerge/sdk`)
- `src/editor`, `src/view`, `src/platform`, `src/io`, `src/plugins` — Editor + plugins
- `collaboration-server/` — sample ops WebSocket server

## Entry points

| User need        | Doc                                |
| ---------------- | ---------------------------------- |
| Install / API    | `docs/guide/editor.md`             |
| JSON model       | `docs/guide/document-model.md`     |
| Write a plugin   | `docs/guide/authoring-plugins.md`  |
| Plugin catalog   | `docs/plugins/`                    |
| Framework / host | `docs/integrate/`                  |
| v1 upgrade       | `docs/guide/migration-v1-to-v2.md` |

## Verify

```bash
pnpm docs:build
```

## Rules of thumb

- Integrations and per-plugin pages keep their substance; prefer restructuring and fixing drift over deleting recipes.
- Shared install/CSS lives in Guide — plugin pages link there instead of repeating `npm install`.
- Do not document unwired APIs (`EditorOptions.mode` was removed for this reason).
