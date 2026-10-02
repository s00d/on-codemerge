# Language Plugin

Toolbar UI for switching the editor locale. **Core** locale files live in `packages/editor/src/i18n/locales`. Large plugins add their own packs under `plugins/*/i18n/locales` and merge them on `setLocale`.

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

<EditorComponent
  :activePlugins="['LanguagePlugin']"
  :showDescription="false"
  :showResults="false"
/>

## How loading works

| Locale | How it loads                                                                  |
| ------ | ----------------------------------------------------------------------------- |
| `en`   | Bundled with the editor (+ each plugin's `en.json` merged in `setup`)         |
| others | Core pack via `import.meta.glob`, then plugin overlays awaited by `setLocale` |

`editor.setLocale(code)` is **always** `Promise<void>`: it loads the core pack if needed, awaits plugin overlays, then switches. `registerLocale(locale, dict)` merges without blocking the core load. `LanguagePlugin` only opens the language menu and remembers the choice in `localStorage`.

```ts
editor.listLocales(); // ['de','en','es',…]
await editor.setLocale('ja');
editor.registerLocale('xx', { toolbar: { bold: 'Bld' } }); // merge overlay / custom pack
```

Key parity across locale packs: `pnpm run check:locales` (editor + each `plugins/*/i18n/locales`).

## Related

- [Core](/guide/editor.md) — localization API
