# Color Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Text and highlight colors.

## Usage

```js
import { HTMLEditor, ColorPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ColorPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
