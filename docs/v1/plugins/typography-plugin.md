# Typography Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Line height, letter spacing, and related text styles.

## Usage

```js
import { HTMLEditor, TypographyPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TypographyPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
