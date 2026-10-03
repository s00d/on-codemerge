# Integrate

Embed On-Codemerge in a host page. Day-to-day apps load and save **HTML** (`setHTML` / `getHTML`) or **Markdown** (`setMarkdown` / `getMarkdown`).

JSON (`getJSON` / `setJSON`) is the internal document model — useful for sync / tooling, not the default path.

Install and CSS: [Editor API — Getting Started](/guide/editor#getting-started). Published pages: `getPublishedDocument()`. SDK: [SDK reference](/guide/sdk). Upgrading from 1.x: [Migration v1 → v2](/guide/migration-v1-to-v2).

## Pattern

Every host follows the same lifecycle:

1. Mount a DOM node.
2. `new Editor(el, { plugins: createCorePlugins() })` (or a surface editor).
3. `setHTML` / `setMarkdown` / `setText` to load.
4. Listen for `docChanged` (or poll getters) to save.
5. Call `editor.destroy()` on unmount.

```ts
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(host, { plugins: createCorePlugins() });
editor.setHTML(initialHtml);
editor.on('docChanged', () => save(editor.getHTML()));
// later:
editor.destroy();
```

## Guides

| Guide                                 | Topic                                       |
| ------------------------------------- | ------------------------------------------- |
| [Chrome & host](./chrome-and-host.md) | `chrome: 'bar' \| 'page'`, portals, hosting |
| [React](./react.md)                   | React                                       |
| [Vue 3](./vue3.md)                    | Vue 3                                       |
| [Next.js](./next.md)                  | Next.js                                     |

Other stacks (Vue 2, Svelte, Angular, Express, …) use the same mount/unmount pattern above — wrap the host lifecycle in the framework’s effect / component teardown.
