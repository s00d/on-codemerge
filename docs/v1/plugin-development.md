# Plugin development (v1)

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Authoring plugins (v2)](/guide/authoring-plugins) · [Migrate](/guide/migration-v1-to-v2).

## Minimal plugin

```ts
import type { Plugin } from 'on-codemerge';
import type { HTMLEditor } from 'on-codemerge';

export class MyPlugin implements Plugin {
  name = 'my-plugin';

  private editor: HTMLEditor | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    editor.on('content-change', this.onChange);
  }

  destroy(): void {
    this.editor?.off('content-change', this.onChange);
    this.editor = null;
  }

  private onChange = (): void => {
    // ...
  };
}
```

Register: `editor.use(new MyPlugin())`.

## Toolbar button

Use the toolbar API from `ToolbarPlugin` (v1) to add a button that runs a command or opens a popup. Keep UI teardown in `destroy()`.

## Commands & history

Prefer the editor command helpers when mutating content so HistoryPlugin can undo. Avoid raw `document.execCommand` unless you also sync editor state.

## Events

- Listen with `editor.on(name, handler)`
- Emit with `editor.triggerEvent(name, payload)`
- Always `off` in `destroy`

## Styles

Ship `style.scss` (editor chrome) and `public.scss` (published page) next to the plugin; import them from the plugin entry.

## Checklist

1. Implement `name` + `initialize` (+ `destroy`)
2. No leaked listeners / DOM nodes after destroy
3. Locale keys via `editor.t(...)`
4. Document options on the plugin page under [Plugins](/v1/plugins/)
