# Mermaid (`@codemerge/mermaid`)

Sync **Mermaid-subset** SVG renderer used by Markdown preview/publish and Charts (most types). It is **not** the full Mermaid.js engine: no CDN, no CSS injection, presentation attributes only.

## What “subset” means

- Pipeline: `detectDiagramType` → `parse` → `layout` → `render` (SVG string).
- Supported diagram headers (see `DiagramType`): `flowchart`, `sequence`, `class`, `er`, `state`, `pie`, `gantt`, `mindmap`, `xychart`, `radar`.
- Syntax, arrows, and directives may differ from upstream Mermaid. Unknown headers and unsupported constructs fail parse (Markdown hydrate surfaces `data-ocm-mermaid-error`).
- Prefer diagrams that stay within the OCM corpus / docs examples; do not assume every Mermaid Live Editor snippet will render identically.

## Install

```bash
pnpm add @codemerge/mermaid
```

Also available through the product tree (Markdown / Charts apps bundle it). Prefer the scoped package when you only need diagrams.

## API

```ts
import { detectDiagramType, parse, layout, render } from '@codemerge/mermaid';

const source = `flowchart LR
  A[Start] --> B[End]
`;

detectDiagramType(source); // 'flowchart' | null

const { ir, diagnostics } = parse(source);
if (ir === null) {
  throw new Error(diagnostics.map((d) => d.message).join('\n'));
}

const svg = render(source, {/* theme / layout opts */});
```

| Export              | Role                                       |
| ------------------- | ------------------------------------------ |
| `detectDiagramType` | Header → type, or `null` if unknown        |
| `parse`             | Source → IR + diagnostics                  |
| `layout`            | IR → positioned graph                      |
| `render`            | Source → SVG string (throws on parse fail) |
| `DEFAULTS` / `DARK` | Built-in themes                            |

## Used by

| Surface                                           | Path                              |
| ------------------------------------------------- | --------------------------------- |
| Markdown workspace / publish                      | `hydrateMermaidBlocks` → `render` |
| Charts (bar, line, area, pie, doughnut, radar, …) | `toMermaidSource` → `render`      |
| Charts scatter / bubble                           | Canvas paint (not Mermaid)        |

See [Markdown Editor](/guide/markdown-editor), [Charts Editor](/guide/charts-editor), and [SDK](/guide/sdk) (`public.js` mermaid hydrate).

## See also

- [View runtime](/guide/view) — DOM helpers for hosts that mount SVG
- [Publishing packages](/guide/publishing-packages) — release order includes `@codemerge/mermaid`
