# Core (v1)

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).

## HTMLEditor

Main instance: owns the editable DOM, plugins, locale, and events.

```ts
const editor = new HTMLEditor(container);

editor.setHtml('<p>Hello</p>');
const html = editor.getHtml();

editor.use(new ToolbarPlugin());
await editor.setLocale('en');
editor.t('toolbar.bold'); // translate

editor.on('content-change', (html) => {
  /* ... */
});
editor.off('content-change', handler);
```

Useful methods (v1): `setHtml` / `getHtml`, `insertTextAtCursor`, `use`, `on` / `off` / `triggerEvent`, `setLocale` / `t`, `destroy`.

## Plugins

```ts
interface Plugin {
  name: string;
  initialize: (editor: HTMLEditor) => void;
  destroy?: () => void;
}
```

Register with `editor.use(plugin)`. `PluginManager` tracks lifecycle; call `editor.destroy()` (or unregister) to tear down.

## Events

Pub/sub on the editor. Plugins listen for content and UI events; prefer namespaced custom events for cross-plugin chatter.

## Locales

`setLocale(code)` switches language; `t(key)` resolves strings. Ship locale packs with the package; plugins can contribute keys.

## Next

- [Write a v1 plugin](/v1/plugin-development)
- [Plugin catalog](/v1/plugins/)
- [Upgrade to v2](/guide/migration-v1-to-v2)
