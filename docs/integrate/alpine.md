# Alpine

`registerAlpine(Alpine)` from `@codemerge/integrate/alpine` — data component `ocmEditor`.

## Value + changes

```html
<script type="module">
  import Alpine from 'alpinejs';
  import { registerAlpine } from '@codemerge/integrate/alpine';
  registerAlpine(Alpine);
  Alpine.start();
</script>

<div
  x-data="ocmEditor({ value: '<p></p>' })"
  x-init="init()"
  @destroy="destroy()"
  style="min-height:300px"
></div>
```

`ocmEditor` keeps `value` in Alpine state and updates it on change. Or mount manually:

```js
import { mountCodeMergeEditor } from '@codemerge/integrate/alpine';

const host = mountCodeMergeEditor(el, {
  value: '<p></p>',
  onChange: (v) => {
    /* your Alpine / store */
  },
});
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
