# Form Builder Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Build forms (fields, templates) inside the document.

## Usage

```js
import { HTMLEditor, FormBuilderPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FormBuilderPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
