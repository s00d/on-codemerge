# Spell Checker Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Hunspell-based spell checking.

## Usage

```js
import { HTMLEditor, SpellCheckerPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new SpellCheckerPlugin());
```

## Options

```js
editor.use(
  new SpellCheckerPlugin({
    // dictionaries: { en: { aff, dic } }
  })
);
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
