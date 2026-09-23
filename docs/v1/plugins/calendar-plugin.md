# Calendar Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Calendar widget + events in the document.

## Usage

```js
import { HTMLEditor, CalendarPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CalendarPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
