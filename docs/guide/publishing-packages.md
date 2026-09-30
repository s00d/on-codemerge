# Publishing `@codemerge/*` and `on-codemerge`

Phase A: low-level packages are published **alongside** the product tarball. The monolith still bundles kernel/sdk/hunspell — consumers of `on-codemerge` do not need the scoped packages.

## One command

From the repo root (npm logged in for `@codemerge` + `on-codemerge`):

```bash
pnpm run release
```

Runs `check` → product builds / export gates / publint → publishes in order:

1. `@codemerge/kernel`
2. `@codemerge/sdk`
3. `@codemerge/hunspell`
4. `@codemerge/collaboration-server`
5. `on-codemerge`

## Workspace deps

- Internal packages: `workspace:^` (not `workspace:*`)
- Shared third-party versions: pnpm `catalog:` in [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)
- Package builds: each publishable package has its own `vite.config.ts` and `"build": "vite build"`; collaboration-server also runs `vite.cli.config.ts` for the bin

## Consumer guidance

| Need                              | Install                           |
| --------------------------------- | --------------------------------- |
| Editor app                        | `on-codemerge` only               |
| Headless doc/ops                  | `@codemerge/kernel`               |
| Plugin authoring without monolith | `@codemerge/sdk` (+ kernel)       |
| Spell without editor              | `@codemerge/hunspell`             |
| Demo / self-hosted collab WS      | `@codemerge/collaboration-server` |

**Warning:** do not install `on-codemerge` and `@codemerge/sdk` into the same application bundle (duplicate SDK/kernel instances).
