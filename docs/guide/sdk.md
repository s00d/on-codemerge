# SDK reference

Published path: **`on-codemerge/sdk`** (workspace alias `@on-codemerge/sdk` → sources).

Plugins and host apps that need UI primitives, commands, or publish helpers import from here — **not** from `on-codemerge/kernel` inside a plugin, and **not** from deep `src/utils/*` paths.

```ts
import {
  definePlugin,
  core,
  h,
  mount,
  insertAtomAfter,
  composePublishedDocument,
} from 'on-codemerge/sdk';
```

The **`Editor`** class and headless HTML/Markdown IO live on the package root (`on-codemerge`) — see [Editor API](./editor.md). This page lists what `on-codemerge/sdk` exports.

## Packages

| Import                | Role                                                  |
| --------------------- | ----------------------------------------------------- |
| `on-codemerge`        | `Editor`, plugins, `importHTML` / `exportMarkdown`, … |
| `on-codemerge/sdk`    | Plugin authoring + UI + publish helpers               |
| `on-codemerge/kernel` | Pure doc/ops (use via `core` from plugins)            |

## Plugin authoring

| Export                                              | Role                                          |
| --------------------------------------------------- | --------------------------------------------- |
| `definePlugin(def)`                                 | Seal a plugin descriptor                      |
| `collectPublishNodes(plugins)`                      | Map `data-node` → `PublishNodeDefinition`     |
| `isDeclarativeWidget`                               | Type guard for widget defs                    |
| `createPluginContext`                               | Build `PluginContext` (normally Editor-owned) |
| `DisposableScope` / `OwnedSlot` / `teardownOwnable` | Lifetime helpers                              |

`PluginDefinition` may include `commands`, `hotkeys`, `widgets`, `publish`, `setup(ctx)`, locales, etc. See [Authoring plugins](./authoring-plugins.md).

### Publish hooks

```ts
definePlugin({
  name: 'timer',
  publish: {
    node: 'timer',
    runtime: 'timer', // id in dist/public.js
    render: (attrs) => h('div', { class: 'timer-widget', attrs: { … } }, […]),
  },
});
```

| Export                                                    | Role                             |
| --------------------------------------------------------- | -------------------------------- |
| `definePublishRuntime` / `registerPublishRuntime`         | Define / register a page runtime |
| `publishRuntimes` / `PublishRuntimeRegistry`              | Boot `[data-ocm-runtime]` hosts  |
| `readOcmConfig` / `setOcmConfig`                          | `data-ocm-config` JSON           |
| `neededRuntimeIds(html\|root)`                            | Which runtimes a fragment needs  |
| `composePublishedDocument({ bodyHtml, cssHref, jsHref })` | Full HTML document string        |
| `publishedCssHref` / `publishedJsHref`                    | Default CDN/`dist` asset URLs    |
| `OCM_RUNTIME_ATTR` / `OCM_CONFIG_ATTR`                    | Attribute name constants         |
| `PUBLISHED_CONTENT_CLASS`                                 | Wrapper class for published body |

Pair with Editor: `getPublishedHTML()` / `getPublishedDocument()` / `getPublishedJS()`.

## ViewSpec UI (`h` / `mount`)

Build plugin UI with ViewSpec — no `document.createElement` / `innerHTML` in plugins.

| Export                                      | Role                                               |
| ------------------------------------------- | -------------------------------------------------- |
| `h` / `text` / `fragment`                   | Elements / text / fragments                        |
| `foreign`                                   | Escape hatch (still mount children with `h`)       |
| `img` / `video` / `iframe` / `canvas`       | Typed element helpers                              |
| `mount` / `patch` / `renderDetached`        | Attach / update / detached root                    |
| `viewToHtml`                                | Serialize ViewSpec → HTML string (export boundary) |
| `ui`                                        | Namespace object mirroring the helpers above       |
| `downloadUrl` / `downloadBlob` / `pickFile` | File download / picker portals                     |

## Portals

| Export                                                | Role                                            |
| ----------------------------------------------------- | ----------------------------------------------- |
| `createPortal` / `teleport` / `isTeleport`            | Mount outside the editor host                   |
| `getPortalRoot` / `setPortalRoot` / `clearPortalRoot` | Named roots (`body`, `menu`, `popup`, `notify`) |

Required for shadow DOM / iframe hosts — see [Chrome & host](/integrate/chrome-and-host).

## Chrome services

| Export                                                                | Role                                         |
| --------------------------------------------------------------------- | -------------------------------------------- |
| `ToolbarPanel`                                                        | Core toolbar panel (Editor owns an instance) |
| `PopupService` / `PopupController`                                    | Modal / popup stack                          |
| `ContextMenuService`                                                  | Context menus                                |
| `NotifyService`                                                       | Toasts / confirms                            |
| `placeRoot` / `placeSubmenu` / `applyPlaceRoot` / `applyPlaceSubmenu` | Menu positioning                             |
| `editorChromeTv`                                                      | Tailwind-variants tokens for chrome          |

Types: `ToolbarButton`, `ToolbarMenuDef`, `PopupOptions`, `MenuItem`, `NotifyOptions`, …

## Commands & `core`

| Export                                                 | Role                                                      |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `core`                                                 | Kernel facade (`toggleMark`, `insertText`, `applyOps`, …) |
| `insertAtomAfter` / `insertBlockNearSelection`         | Insert blocks/atoms                                       |
| `setMarkAttrs` / `setBlockAttr`                        | Mark / block attrs                                        |
| `replaceBlockType` / `convertBlockType` / `wrapInList` | Structure                                                 |
| `withMarkTarget`                                       | Expand caret to word before mark ops                      |
| `attrString`                                           | Safe string coerce for attrs                              |
| `findAncestorPath` / `resolveInsertSite`               | Path helpers                                              |

## `EditorAPI` (type)

Plugins receive `ctx.editor: EditorAPI`. Document boundaries on that surface:

| Method                                                         | Role           |
| -------------------------------------------------------------- | -------------- |
| `getJSON` / `setJSON`                                          | SoT            |
| `getHTML` / `setHTML`                                          | Semantic HTML  |
| `getMarkdown` / `setMarkdown`                                  | Markdown       |
| `getPublishedHTML` / `getPublishedJS` / `getPublishedDocument` | Published page |
| `command` / `run` / `dispatch`                                 | Commands       |
| `toolbar` / `ui.popup` / `ui.menu` / `notify`                  | Chrome         |
| `t` / `setLocale` / …                                          | i18n           |

Full usage examples: [Editor API](./editor.md).

## CSS entry points (package)

| Import                    | Role                                    |
| ------------------------- | --------------------------------------- |
| `on-codemerge/index.css`  | Editor chrome                           |
| `on-codemerge/public.css` | Published atom skins + prose            |
| `on-codemerge/sdk.css`    | SDK chrome styles                       |
| `on-codemerge/public.js`  | Published runtimes (timer, calendar, …) |

## Related

- [Authoring plugins](./authoring-plugins.md)
- [Editor API](./editor.md) — HTML / Markdown / published boundaries
- [Document model](./document-model.md)
- [Export plugin](/plugins/export-plugin)
