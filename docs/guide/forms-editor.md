# Forms Editor

Form builder product published as **`on-codemerge/forms`**. Thin app entry uses a shell ViewPort and **`FormBuilderPlugin({ surface: 'workspace' })`**, which mounts the shared form studio (palette / canvas / inspector) into `contentTarget`. Interchange via `getText` / `setText` (pretty `FormConfig` JSON).

<script setup>
import FormsEditorComponent from '../components/FormsEditorComponent.vue';
</script>

<FormsEditorComponent :showDescription="false" />

## Install

```bash
npm install --save on-codemerge
```

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/forms';

const host = document.getElementById('forms-editor')!;
const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // FormBuilderPlugin({ surface: 'workspace' })
});

editor.on('docChanged', () => {
  console.log(editor.getText());
});

editor.setText('{"id":"f1","method":"POST","action":"","fields":[]}');
editor.destroy();
```

`createView` defaults to `createShellView`. Local SPA: `pnpm dev:forms`.

### Same plugin in WYSIWYG

```ts
import { Editor, createDefaultPlugins, FormBuilderPlugin } from 'on-codemerge';

new Editor(host, {
  plugins: [
    ...createDefaultPlugins(), // includes FormBuilderPlugin({ surface: 'atom' })
  ],
});
```

`surface: 'atom'` opens the same `mountFormWorkspace` UI in an `lg` popup (Save/Cancel). Schema is the SoT — edit loads from `attrs.schema`, not DOM scrape. Hotkey `Mod-Alt-f` opens the studio. See [Form Builder Plugin](/plugins/form-builder-plugin) and [Editors](/guide/editors).

### Types

Published types for `on-codemerge/forms` expect TypeScript `moduleResolution: "bundler"` (or `skipLibCheck: true`).

## Document API

| Method                       | Role                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `getText()`                  | Pretty `FormConfig` JSON                                           |
| `setText(text)`              | Replace SoT; returns `ParseError \| null` (SoT unchanged on error) |
| `getJSON()` / `setJSON(doc)` | Kernel document snapshot (`doc → form`)                            |
| `run` / `command` / `use`    | Same as WYSIWYG                                                    |
| `on('docChanged', …)`        | Subscriptions                                                      |
| `destroy()`                  | Tear down                                                          |

## Document shape

SoT is `doc` → single `form` child. Field list and HTTP settings live in `attrs.schema` (`FormConfig`).

## Toolbar

`createDefaultPlugins()` ships Clear / wide·narrow preview (`defaultFormToolbar()`). Templates, field palette, and method live in the studio. Customize via `toolbar` / `createDefaultPlugins({ toolbar })`.

## Local demo

```bash
pnpm dev:forms    # apps/forms SPA
pnpm build:forms  # → dist-forms/
```

## See also

- [Editors](./editors.md) — product matrix
- [Form Builder Plugin](/plugins/form-builder-plugin) — atom + workspace options
- [Editor API](./editor.md) — WYSIWYG entry (`on-codemerge`)
