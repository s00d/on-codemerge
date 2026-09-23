# Block Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Headings, paragraphs, quotes, and other block types.

## Usage

```js
import { HTMLEditor, BlockPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new BlockPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
