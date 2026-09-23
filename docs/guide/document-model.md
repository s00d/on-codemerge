# Document model

Own virtual document kernel for on-codemerge. **No ProseMirror / TipTap / Lexical / BlockNote / Slate / CKEditor as foundation.**

## Source of truth

`EditorState = { doc, selection }` in memory. DOM is a projection. All writes go through `dispatch(transaction | command)`.

## Dependency verdict (R0)

| Candidate                          | Verdict                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| ProseMirror / TipTap / Lexical / … | **Forbidden** as editor core                                          |
| `dompurify`                        | **Accepted** for HTML import/paste sanitization only                  |
| `yjs`                              | **Deferred** — custom binding later; not `y-prosemirror`              |
| `edix`                             | **Rejected for now** — experimental; own `InputBridge` covers typing  |
| `selection-ranges`                 | **Rejected for now** — own path/offset mapping                        |
| `rope-sequence`                    | **Deferred** — own tree + structural sharing sufficient for Phase 0–2 |

## JSON shape

```json
{
  "version": 1,
  "doc": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "id": "p1",
        "content": [{ "type": "text", "text": "Hello", "marks": [{ "type": "bold" }] }]
      }
    ]
  }
}
```

## Layers

- `packages/kernel` — pure model (no DOM); published as `on-codemerge/kernel`
- `src/view` — reconcile + input bridge
- `src/platform` — sealed extensions
- `src/io` — JSON / HTML / Markdown adapters (`importHTML`, `exportMarkdown`, … on `on-codemerge`)
- `src/editor` — public `Editor` facade
- `packages/sdk` — `definePlugin`, UI services (`on-codemerge/sdk`) — [SDK reference](./sdk.md)

## Boundaries

| API                                         | Role                                       |
| ------------------------------------------- | ------------------------------------------ |
| `getJSON` / `setJSON`                       | Source of truth                            |
| `getHTML` / `setHTML`                       | Semantic HTML (atoms as empty `data-node`) |
| `getMarkdown` / `setMarkdown`               | Markdown subset                            |
| `getPublishedHTML` / `getPublishedDocument` | Hydrated public pages                      |

Details and headless helpers: [Editor API](./editor.md).

## TDD

All kernel modules have `__tests__`. Red → green → refactor. `pnpm test` required before release.
