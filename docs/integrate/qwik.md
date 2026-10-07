# Qwik

`@codemerge/integrate/qwik` is an alias of `/mount`. Mount only in the browser (`useVisibleTask$`).

## Value + changes

```tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { mountCodeMergeEditor } from '@codemerge/integrate/qwik';

export const PageEditor = component$(() => {
  const el = useSignal<HTMLElement>();
  const html = useSignal('<p></p>');

  useVisibleTask$(({ cleanup }) => {
    if (!el.value) return;
    const host = mountCodeMergeEditor(el.value, {
      value: html.value,
      onChange: (v) => {
        html.value = v;
      },
    });
    cleanup(() => host.destroy());
  });

  return <div ref={el} style={{ minHeight: '300px' }} />;
});
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
