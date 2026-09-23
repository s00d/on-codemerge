# Table Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Insert and edit tables (rows/cols/merge).

## Usage

```js
import { HTMLEditor, TablePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TablePlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
