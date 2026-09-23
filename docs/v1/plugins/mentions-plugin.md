# Mentions Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

`@mention` autocomplete.

## Usage

```js
import { HTMLEditor, MentionsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new MentionsPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
