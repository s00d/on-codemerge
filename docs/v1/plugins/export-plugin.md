# Export Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Export document (HTML / other formats exposed by the plugin).

## Usage

```js
import { HTMLEditor, ExportPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ExportPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
