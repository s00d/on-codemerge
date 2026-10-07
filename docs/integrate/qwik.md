# Qwik

Lazy-load the editor on the client. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Minimal example

```tsx
import { component$, useVisibleTask$, useSignal } from '@builder.io/qwik';

export const MyEditor = component$(() => {
  const hostRef = useSignal<HTMLDivElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ cleanup }) => {
    const [{ Editor, createCorePlugins }] = await Promise.all([
      import('on-codemerge'),
      import('on-codemerge/index.css'),
      import('on-codemerge/public.css'),
    ]);
    const el = hostRef.value;
    if (!el) return;
    const editor = new Editor(el, { plugins: createCorePlugins() });
    editor.setHTML('<p>Hello from Qwik</p>');
    cleanup(() => editor.destroy());
  });

  return <div ref={hostRef} style={{ minHeight: 300 }} />;
});
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Only construct `Editor` inside `useVisibleTask$` / browser code.
- CSS side-effect imports must run in the browser bundle.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
