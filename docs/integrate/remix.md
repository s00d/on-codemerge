# Remix / React Router

Client-only editor route. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

Same React component as [React](./react.md) / [Next.js](./next.md). In Remix (or React Router 7 framework mode), keep it out of the server render:

```tsx
import { ClientOnly } from 'remix-utils/client-only'; // or your own fallback
import { MyEditor } from './MyEditor';

export default function EditorRoute() {
  return (
    <ClientOnly fallback={<p>Loading editor…</p>}>
      {() => <MyEditor value="<p>Hello from Remix</p>" />}
    </ClientOnly>
  );
}
```

Or load HTML in a `loader` and pass it as a prop — still mount the editor only on the client:

```ts
// loader returns { html }
export async function loader() {
  return Response.json({ html: '<p>…</p>' });
}
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Do not instantiate `Editor` during SSR.
- Destroy in effect cleanup on route transitions.

## Related

- [React](./react.md)
- [Next.js](./next.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
