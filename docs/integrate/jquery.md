# jQuery

`registerJQueryPlugin($)` from `@codemerge/integrate/jquery`.

## Value + changes

```js
import $ from 'jquery';
import { registerJQueryPlugin } from '@codemerge/integrate/jquery';

registerJQueryPlugin($);

let html = '<p></p>';
$('#editor').ocmEditor({
  value: html,
  onChange: (value) => {
    html = value;
  },
});
```

Packs / upload in the same options object — [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
