# Publishing `@codemerge/*` and `on-codemerge`

This repo is **pnpm-only**. Install, scripts, check, and publish all go through pnpm (`pnpm install`, `pnpm run …`, `pnpm run release`). Do not use the npm CLI in this tree.

`pnpm run release` does **not** bump versions. It publishes whatever is already in `package.json`. Bump + commit + git tag first, then release.

Phase A: low-level packages are published **alongside** the product tarball. The monolith still bundles kernel/sdk/view/mermaid/hunspell — consumers of `on-codemerge` do not need the scoped packages for normal editor use.

## One command

From the repo root (`pnpm login` for `@codemerge` + `on-codemerge`):

```bash
pnpm run release
```

Runs `prepublishOnly` (packages build + check + product builds) then publishes with pnpm in order:

1. `@codemerge/kernel`
2. `@codemerge/view`
3. `@codemerge/mermaid`
4. `@codemerge/sdk`
5. `@codemerge/hunspell`
6. `@codemerge/collaboration-server`
7. `on-codemerge`

## Workspace deps

- Internal packages: `workspace:^` (not `workspace:*`)
- Shared third-party versions: pnpm `catalog:` in [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)
- Package builds: each publishable package has its own `vite.config.ts` and `"build": "vite build"`; collaboration-server also runs `vite.cli.config.ts` for the bin

## Consumer guidance

| Need                              | Install                           |
| --------------------------------- | --------------------------------- |
| Editor app                        | `on-codemerge` only               |
| Headless doc/ops                  | `@codemerge/kernel`               |
| ViewSpec DOM only                 | `@codemerge/view`                 |
| Mermaid-subset SVG only           | `@codemerge/mermaid`              |
| Plugin authoring without monolith | `@codemerge/sdk` (+ kernel/view)  |
| Spell without editor              | `@codemerge/hunspell`             |
| Demo / self-hosted collab WS      | `@codemerge/collaboration-server` |

**Warning:** do not install `on-codemerge` and `@codemerge/sdk` into the same application bundle (duplicate SDK/kernel instances).

See also [Mermaid](/guide/mermaid) and [View runtime](/guide/view).
