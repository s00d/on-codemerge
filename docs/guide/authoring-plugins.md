# Authoring plugins

Plugins import the SDK via the published path **`on-codemerge/sdk`** (workspace may alias `@on-codemerge/sdk` to sources). App helpers under `src/utils` are **package-internal** — third-party plugins should use only the public SDK, not deep imports into that folder.

```ts
import { definePlugin, core, insertAtomAfter, setMarkAttrs } from 'on-codemerge/sdk';

export function MyPlugin() {
  return definePlugin({
    name: 'my-plugin',
    commands: {
      insertWidget: insertAtomAfter('myAtom', { src: '' }),
      paint: setMarkAttrs('textColor', { color: '#f00' }),
    },
    setup(ctx) {
      ctx.toolbar.add({
        id: 'my',
        label: 'My',
        group: 'format',
        order: 25,
        onClick: () => ctx.editor.command('insertWidget'),
      });
    },
  });
}
```

`setup` receives a **`PluginContext`** (`ctx`), not the raw editor. Use `ctx.editor`, `ctx.toolbar`, `ctx.popup`, `ctx.menu`, `ctx.notify`, `ctx.on` / `ctx.onDom`, `ctx.own`, `ctx.scope`.

## Workspaces

| Package               | Role                                                   |
| --------------------- | ------------------------------------------------------ |
| `on-codemerge/kernel` | Pure doc/ops model (workspace: `@on-codemerge/kernel`) |
| `on-codemerge/sdk`    | `core.*`, `definePlugin`, UI services, command helpers |
| `on-codemerge`        | Editor + plugins                                       |

## Rules

1. Never import `on-codemerge/kernel` from a plugin — use `core` / helpers from SDK.
2. Never invent modal/toolbar DOM — use `ctx.toolbar` / `ctx.popup` / `ctx.menu` / `ctx.notify`.
3. Command helpers (`insertAtomAfter`, `setMarkAttrs`, …) live in the SDK.

## Toolbar: bar vs menus

The sticky toolbar chrome is **core-owned** (`ToolbarPanel`). **Menus come from Editor construct options** (`toolbar.menus`); plugins only register items (and may `defineMenu` for custom dropdowns).

```ts
// Host: which overflow menus exist (omit → Insert / Review / Tools)
new Editor(host, {
  toolbar: {
    menus: [
      { id: 'insert', label: 'Insert', icon: insertIcon, group: 'insert', order: 40 },
    ],
  },
  plugins: [ChartsPlugin(), TablePlugin()],
});

// Flat bar — no dropdowns; plugin `menu: 'insert'` falls through to the bar
new Editor(host, { toolbar: { menus: [] }, plugins: [ChartsPlugin()] });

// Top-level button (group → separators, group-aware sort)
ctx.toolbar.add({
  id: 'font-settings',
  icon: fontIcon,
  group: 'format',
  order: 14,
  onClick: openFont,
});

// Overflow item — only if host registered that menu id
ctx.toolbar.add({
  id: 'table',
  icon: tableIcon,
  menu: 'insert',
  order: 30,
  onClick: openTablePicker,
});

// Plugin factory placement (optional)
ChartsPlugin(); // default menu: 'insert'
ChartsPlugin({ menu: null }); // always on the bar
ChartsPlugin({ menu: 'insert', order: 50 });

// Custom menu (any plugin may define one — then add items to it)
ctx.toolbar.defineMenu({
  id: 'acme',
  label: 'Acme',
  group: 'tools',
  order: 70,
});
ctx.toolbar.add({ id: 'acme-x', label: 'X', menu: 'acme', order: 1, onClick: … });
```

| Placement      | How                                                                                    |
| -------------- | -------------------------------------------------------------------------------------- |
| Bar            | `toolbar.add` **without** `menu`, or `menu` id missing from config                     |
| Named dropdown | `toolbar.add({ menu: 'insert' })` **and** that id is in `toolbar.menus` / `defineMenu` |
| Empty menu     | Trigger is hidden until at least one item exists                                       |
| Flat host      | `toolbar: { menus: [] }` — every `menu:` target becomes a bar button                   |

Default menus when **`toolbar` is omitted**: **`insert`**, **`review`**, **`tools`** (`defaultWysiwygToolbarMenus`). SDK helpers: `PluginToolbarOpts` / `pluginToolbarPlacement`.

`ToolbarPlugin()` only adds B/I/U/S marks. It does **not** own the panel.

## Portals (Teleport)

Overlays must not live under the editor host (transforms / overflow break `position: fixed`).
SDK portals mirror Vue `<Teleport>`:

```ts
import { createPortal, teleport, h, getPortalRoot } from 'on-codemerge/sdk';

const portal = createPortal(h('div', { class: 'my-layer' }, 'Hi'), { to: 'popup' });
portal.destroy();

h('div', null, ['inline', teleport('body', h('div', { class: 'floating' }, 'away'))]);
```

Named roots (`body` | `menu` | `popup` | `notify`) live under `document.body` as
`[data-ocm-portal="…"]`. Popup / context menu / notify / toolbar dropdowns use them.
Override with `setPortalRoot('popup', el)` for shadow DOM / iframe hosts.

## Publish (`publish` + runtimes)

Atoms that need rich public markup declare `publish` on the plugin:

```ts
publish: {
  node: 'timer',
  runtime: 'timer',
  render: (attrs) => manager.timerView(parse(attrs.payload)),
},
```

- `editor.getPublishedHTML()` runs each `publish.render` via ViewSpec → HTML.
- Interactive widgets register a runtime under `plugins/*/publish/runtime.ts` (bundled into `dist/public.js`).
- Semantic `getHTML()` keeps empty `data-node` shells for round-trip.

Full export list: [SDK reference](./sdk.md). Boundaries: [Editor API](./editor.md).

## Migrating from v1

See [Migration v1 → v2](/guide/migration-v1-to-v2).
