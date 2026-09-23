# Language Plugin

Toolbar UI for switching the editor locale. Locale **files and loading** live in the editor core (`src/i18n/locales`), not in this plugin.

## Usage

```ts
import { Editor, LanguagePlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [LanguagePlugin()],
});

await editor.setLocale('ru');
await editor.setLocale('en'); // same API
editor.t('common.cancel');
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['LanguagePlugin']" />

## How loading works

| Locale | How it loads                                                       |
| ------ | ------------------------------------------------------------------ |
| `en`   | Bundled with the editor (`src/i18n/locales/en.json`)               |
| others | Async chunks via `import.meta.glob` from `src/i18n/locales/*.json` |

`editor.setLocale(code)` is **always** `Promise<void>`: it loads the pack if needed, then switches. `LanguagePlugin` only opens the language menu and remembers the choice in `localStorage`.

```ts
editor.listLocales(); // ['de','en','es',…]
await editor.setLocale('ja');
editor.registerLocale('xx', { toolbar: { bold: 'Bld' } }); // app-provided pack
```

Key parity across locale files: `pnpm run check:locales`.

## Related

- [Core](/guide/editor.md) — localization API
