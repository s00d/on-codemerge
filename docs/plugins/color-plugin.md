# Color Plugin

Text color and highlight (background) marks via a procedural **HSV color well** — no hardcoded product palette and no localStorage.

## Features

- **Text color** mark (`textColor`) and **highlight** mark (`highlight`)
- **HSV well**: saturation/value square + hue slider (colors are generated)
- **Quick swatches**: tones of the current hue + neutrals (also generated)
- **Instant apply** on pick (no Apply button)
- **Clear** removes the mark from the selection
- Toolbar buttons + hotkeys open the picker

## Usage

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

```ts
import { Editor, ColorPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [ColorPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ColorPlugin']" />

## Public API

Factory: `ColorPlugin()`.

| Command       | Role                 |
| ------------- | -------------------- |
| `foreColor`   | Open text-color well |
| `hiliteColor` | Open highlight well  |

```ts
editor.command('foreColor');
editor.command('hiliteColor');
```

### Keyboard shortcuts

| Shortcut      | Command       |
| ------------- | ------------- |
| `Mod-Shift-Q` | `foreColor`   |
| `Mod-Shift-H` | `hiliteColor` |

(`Mod` = Ctrl on Windows/Linux, ⌘ on macOS.)

## Document marks

| Mark        | Attr          | HTML export                       |
| ----------- | ------------- | --------------------------------- |
| `textColor` | `color` (hex) | `span style="color:…"`            |
| `highlight` | `color` (hex) | `span style="background-color:…"` |

## Notes

- Color UI: `src/utils/ColorWell.ts` (Tailwind utilities) + math in `src/utils/colorMath.ts`.
- Reused for table cell bg, block-style color props, chart/calendar color swatches.
- HTML import maps `span style="color"` / `background-color` (and font-family/size) back to marks.
- Chart themes / series palettes are procedural (`hueStrip`), not hardcoded product swatches.
- Text color is **ColorPlugin**, not FontPlugin (FontPlugin = family / size / line-height only).
- Hotkeys open the picker; they do **not** paint a fixed default color.
- Included in `createDefaultPlugins()` and `createCorePlugins()`.

## Related

- [Plugins overview](/plugins/)
- [Authoring plugins](/guide/authoring-plugins)
