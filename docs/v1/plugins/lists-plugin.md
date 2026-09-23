# Lists Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Ordered and unordered lists.

## Usage

```js
import { HTMLEditor, ListsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ListsPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
