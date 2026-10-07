# Solid

`@codemerge/integrate/solid` is an alias of `/mount` (`mountCodeMergeEditor` + CSS). No Solid-specific component.

## Value + changes

```tsx
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { mountCodeMergeEditor } from '@codemerge/integrate/solid';
import type { EditorHostHandle } from '@codemerge/integrate/solid';

export function PageEditor() {
  let el!: HTMLDivElement;
  const [html, setHtml] = createSignal('<p></p>');
  let host: EditorHostHandle | null = null;

  onMount(() => {
    host = mountCodeMergeEditor(el, {
      value: html(),
      onChange: setHtml,
    });
  });

  createEffect(() => {
    const next = html();
    host?.setValue(next);
  });

  onCleanup(() => host?.destroy());

  return <div ref={el} style={{ 'min-height': '300px' }} />;
}
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
