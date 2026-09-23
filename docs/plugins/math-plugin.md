# Math Plugin

Insert via **Insert → Math** or `Mod-Shift-m`. Expressions use a **TeX subset**; the editor renders **MathML** (no KaTeX).

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['MathPlugin']" :showDescription="false" />

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

```js
import { Editor, MathPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(container, {
  plugins: [MathPlugin()],
});
```

## Editor

- **Templates** — starter formulas (quadratic, sum, integral, …)
- **Build** — structure / ops / greek palette with caret holes (`\frac{}{}`)
- **Source** — raw TeX-subset textarea
- Live MathML preview (debounced)
- Right-click formula: edit / align / delete; click to resize

## Notes

- Engine: internal tokenize → AST → MathML (browser layout)
- Document field: `math` atom attrs `{ expression, align, width, height }`
- Supported subset: fractions, roots, scripts, sums/integrals, greek, common ops — not full LaTeX
- HTML export embeds MathML inside `data-node="math"` for published pages
