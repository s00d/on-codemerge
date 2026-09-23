# Spell Checker Plugin

Live spell check via [Typo.js](https://github.com/cfinke/Typo.js) (Hunspell). Dictionaries are **not** shipped with `on-codemerge` — you pass `.aff` / `.dic` URLs when creating the plugin.

Toggle: **Tools → Spell Checker** or `Mod-Shift-s`. Misspellings get a `misspelled` mark (red underline).

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['SpellCheckerPlugin']" :showDescription="false" />

## Install dictionaries

Use Hunspell packages from [wooorm/dictionaries](https://github.com/wooorm/dictionaries) (npm: `dictionary-<locale>`):

```bash
npm install dictionary-en
# optional:
npm install dictionary-ru dictionary-de dictionary-fr
```

Each package contains `index.aff` and `index.dic`.

| Locale  | Package                                              |
| ------- | ---------------------------------------------------- |
| English | `dictionary-en`                                      |
| Russian | `dictionary-ru`                                      |
| German  | `dictionary-de`                                      |
| French  | `dictionary-fr`                                      |
| Spanish | `dictionary-es`                                      |
| …       | `dictionary-<code>` — see the repo for the full list |

You can also host your own `.aff` / `.dic` files and point URLs at them.

## Connect to the editor

### Vite / VitePress

`dictionary-en` only exports `index.js` (uses Node `fs`) — do **not** deep-import `index.aff` via the package name (Vite/Node `exports` will fail). Point at the files with `import.meta.url` (or host them yourself):

```ts
import { Editor, SpellCheckerPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const enAff = new URL('../node_modules/dictionary-en/index.aff', import.meta.url).href;
const enDic = new URL('../node_modules/dictionary-en/index.dic', import.meta.url).href;
// Or: import enAff from './dicts/en.aff?url' after copying the files into your app.

const editor = new Editor(container, {
  plugins: [
    SpellCheckerPlugin({
      dictionaries: {
        en: { aff: enAff, dic: enDic },
        // ru: { aff: ruAff, dic: ruDic },
      },
      // defaultLocale: 'en', // fallback when editor locale has no entry
    }),
  ],
});
```

Allow asset imports in `vite.config.ts` / VitePress `vite` config if needed:

```ts
export default defineConfig({
  assetsInclude: ['**/*.aff', '**/*.dic'],
});
```

### Static / public folder

Copy files into `public/dictionaries/` and pass paths:

```ts
SpellCheckerPlugin({
  dictionaries: {
    en: {
      aff: '/dictionaries/en.aff',
      dic: '/dictionaries/en.dic',
    },
  },
});
```

### Locale matching

The plugin uses the language part of `editor.getLocale()` (`en-US` → `en`). If that key is missing in `dictionaries`, it falls back to `defaultLocale` (default `'en'`), then to the first configured locale.

## Options

```ts
type SpellDictionaryFiles = { aff: string; dic: string };

type SpellCheckerOptions = {
  /** locale → URLs to Hunspell .aff / .dic (required) */
  dictionaries: Record<string, SpellDictionaryFiles>;
  /** fallback locale key (default: 'en') */
  defaultLocale?: string;
};
```

## Styling

Misspelled words use the `misspelled` mark; public CSS paints `.misspelled-word` with a red underline. Override in your app if needed.

## Notes

- `SpellCheckerPlugin` is **not** included in `createDefaultPlugins()` — configure dictionaries and add it yourself.
- Code blocks are skipped.
- Checking is debounced (~280ms) on `docChanged`.
