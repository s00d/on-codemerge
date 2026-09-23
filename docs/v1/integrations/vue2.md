# Vue 2

> Archive: v1 API. Current guides: [Integrate](/integrate/).

Boot **HTMLEditor** on a host element, register plugins, import CSS.

## Example

```vue
<template><div ref="host" /></template>
<script>
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export default {
  mounted() {
    this.editor = new HTMLEditor(this.$refs.host);
    this.editor.use(new ToolbarPlugin());
  },
  beforeDestroy() {
    this.editor?.destroy();
  },
};
</script>
```
