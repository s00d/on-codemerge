# Language Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Switch editor UI locale.

## Usage

```js
import { HTMLEditor, LanguagePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new LanguagePlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
