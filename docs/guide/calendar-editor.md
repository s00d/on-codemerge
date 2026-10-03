# Calendar Editor

Calendar studio published as **`on-codemerge/calendar`**. Thin app entry uses a shell ViewPort and **`CalendarPlugin({ surface: 'workspace' })`**, which mounts the shared calendar studio (layers / canvas / inspector) into `contentTarget`. Interchange via `getText` / `setText` (pretty `CalendarDoc` JSON). Thin ICS import/export is available from the studio header — JSON remains the primary SoT.

<script setup>
import CalendarEditorComponent from '../components/CalendarEditorComponent.vue';
</script>

<CalendarEditorComponent :showDescription="false" />

## Install

```bash
npm install --save on-codemerge
```

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/calendar';

const host = document.getElementById('calendar-editor')!;
const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // CalendarPlugin({ surface: 'workspace' })
});

editor.on('docChanged', () => {
  console.log(editor.getText());
});

editor.setText(
  '{"title":"Cal","tz":"UTC","view":"month","cursor":"2026-10-02","calendars":[{"id":"main","title":"Work","color":"#3b82f6","visible":true}],"events":[]}'
);
editor.destroy();
```

`createView` defaults to `createShellView`. Local SPA: `pnpm dev:calendar`.

### Same plugin in WYSIWYG

```ts
import { Editor, createDefaultPlugins, CalendarPlugin } from 'on-codemerge';

new Editor(host, {
  plugins: [
    ...createDefaultPlugins(), // includes CalendarPlugin({ surface: 'atom' })
  ],
});
```

`surface: 'atom'` opens the same `mountCalendarWorkspace` UI in an `lg` popup (Save/Cancel). Payload is the SoT — edit loads from `attrs.payload`. Hotkey `Mod-Alt-l` opens the studio. See [Calendar Plugin](/plugins/calendar-plugin) and [Editors](/guide/editors).

### Types

Published types for `on-codemerge/calendar` expect TypeScript `moduleResolution: "bundler"` (or `skipLibCheck: true`).

## Document API

| Method                       | Role                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `getText()`                  | Pretty `CalendarDoc` JSON                                          |
| `setText(text)`              | Replace SoT; returns `ParseError \| null` (SoT unchanged on error) |
| `getJSON()` / `setJSON(doc)` | Kernel document snapshot (`doc → calendar`)                        |
| `run` / `command` / `use`    | Same as WYSIWYG                                                    |
| `on('docChanged', …)`        | Subscriptions                                                      |
| `destroy()`                  | Tear down                                                          |

## Document shape

SoT is `doc` → single `calendar` child. Events, layers, view, and cursor live in `attrs.payload` (`CalendarDoc`). One document-level timezone (`tz`). Views: `month`, `week`, `day`, `year`, `agenda`.

## Toolbar

`createDefaultPlugins()` Undo/redo toolbar is built into the editor. Studio chrome owns views, import/export, and add event. Customize via `toolbar` / `createDefaultPlugins({ toolbar })`.

## Local demo

```bash
pnpm dev:calendar    # apps/calendar SPA
pnpm build:calendar  # → dist-calendar/
```

## See also

- [Editors](./editors.md) — product matrix
- [Calendar Plugin](/plugins/calendar-plugin) — atom + workspace options
- [Editor API](./editor.md) — WYSIWYG entry (`on-codemerge`)
