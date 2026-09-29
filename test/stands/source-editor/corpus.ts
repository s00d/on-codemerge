/** Highlight + JSON + MD fixture for the source-editor stand. */
export const CORPUS = `// line comment
/* block comment */
# hash comment
const ident = "string" + 'sq' + \`template\`;
const n = 42 + 3.14 + 0xFF;
const flags = true || false || null;
const ops = a === b !== c && d || e => f;
const punct = { a: [1], b: (x); };
---json---
{
  "hello": "json editor",
  "items": [1, true, null],
  "nested": { "ok": true }
}
---md---
:::warn Caution
Cursor inside a callout → **Turn into** changes the type.
@btn[Got it](#)
:::

\`\`\`mermaid
flowchart LR
  A[Source] --> B[Preview]
\`\`\`
`;
