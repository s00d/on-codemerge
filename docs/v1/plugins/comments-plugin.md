# Comments Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Inline comments on selections.

## Usage

```js
import { HTMLEditor, CommentsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CommentsPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
