# Calendar Plugin

Calendar atoms and the Calendar Editor studio. Source of truth is **`attrs.payload: CalendarDoc`** (no `localStorage`). Same studio UI for WYSIWYG atom popup (`surface: 'atom'`) and the standalone app (`surface: 'workspace'`).

## Features

- Views: month, week, day, year, agenda (week/day share one timed grid)
- Layers (calendars) with color + visibility
- One EventInspector (all-day + RRULE toggles)
- JSON primary I/O; thin ICS import/export
- Drag/resize timed events; month day-move
- Publish reminders via `calendar-reminders` runtime

> Full Calendar-only app: [Calendar Editor](/guide/calendar-editor) · compare surfaces: [Editors](/guide/editors).

## Basic Usage

```ts
import { Editor, CalendarPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [CalendarPlugin()], // surface: 'atom' (default)
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['CalendarPlugin']"
  :showDescription="false"
  :showResults="false"
/>

## Public API

Factory: `CalendarPlugin({ surface?, toolbar?, features? })`.

| Command                |                                    |
| ---------------------- | ---------------------------------- |
| `insertCalendar`       | `editor.command('insertCalendar')` |
| `calendar.addEvent`    | workspace only                     |
| `calendar.clearEvents` | workspace only                     |

### Keyboard shortcuts

| Shortcut    | Command          |
| ----------- | ---------------- |
| `Mod-Alt-l` | `insertCalendar` |

## CalendarDoc

```ts
type CalendarDoc = {
  title: string;
  tz: string; // single doc-level IANA tz
  view: 'month' | 'week' | 'day' | 'year' | 'agenda';
  cursor: string; // YYYY-MM-DD
  calendars: { id: string; title: string; color: string; visible: boolean }[];
  events: CalendarEvent[];
};
```

Legacy payloads `{ calendar, events }` with `date` / `time` / `duration` are coerced on load.

## Surfaces

| Surface     | Role                                                  |
| ----------- | ----------------------------------------------------- |
| `atom`      | In-document widget + `lg` studio popup (Save/Cancel)  |
| `workspace` | Shell ViewPort studio; requires `doc → calendar` seed |

## See also

- [Calendar Editor](/guide/calendar-editor)
- [Editors](/guide/editors)
