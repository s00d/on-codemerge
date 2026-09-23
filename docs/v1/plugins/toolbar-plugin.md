# Toolbar Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Main editor toolbar (bold/italic/… groups).

## Usage

```js
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ToolbarPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
