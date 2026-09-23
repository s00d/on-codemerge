# Font Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Font family and size controls.

## Usage

```js
import { HTMLEditor, FontPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FontPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
