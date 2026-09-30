# Publishing `@codemerge/*` and `on-codemerge`

Phase A: low-level packages are published **alongside** the product tarball. The monolith still bundles kernel/sdk/hunspell — consumers of `on-codemerge` do not need the scoped packages.

## Publish order

From the repo root (npm auth required for scope `@codemerge` and unscoped `on-codemerge`):

```bash
pnpm run build:packages
pnpm run check
pnpm run build

# Scoped packages first (deps before dependents), then product:
pnpm publish --filter '@codemerge/kernel' --access public --no-git-checks
pnpm publish --filter '@codemerge/sdk' --access public --no-git-checks
pnpm publish --filter '@codemerge/hunspell' --access public --no-git-checks
pnpm publish --filter '@codemerge/collaboration-server' --access public --no-git-checks
pnpm publish --filter 'on-codemerge' --access public --no-git-checks
```

Or the orchestrated script (same filters):

```bash
pnpm run release
```

(`prepublishOnly` on the root package runs `build:packages` + full check/build/publint.)

## Consumer guidance

| Need                              | Install                           |
| --------------------------------- | --------------------------------- |
| Editor app                        | `on-codemerge` only               |
| Headless doc/ops                  | `@codemerge/kernel`               |
| Plugin authoring without monolith | `@codemerge/sdk` (+ kernel)       |
| Spell without editor              | `@codemerge/hunspell`             |
| Demo collab WS                    | `@codemerge/collaboration-server` |

**Warning:** do not install `on-codemerge` and `@codemerge/sdk` into the same application bundle (duplicate SDK/kernel instances).
