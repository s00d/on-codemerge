# Shortcuts Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Keyboard shortcut help / bindings UI.

## Usage

```js
import { HTMLEditor, ShortcutsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ShortcutsPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
