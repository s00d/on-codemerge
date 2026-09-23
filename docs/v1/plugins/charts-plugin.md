# Charts Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Insert simple charts from data.

## Usage

```js
import { HTMLEditor, ChartsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ChartsPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
