# Vue 3

> Archive: v1 API. Current guides: [Integrate](/integrate/).

Boot **HTMLEditor** on a host element, register plugins, import CSS.

## Example

```vue
<template><div ref="host" /></template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const host = ref(null);
let editor;
onMounted(() => {
  editor = new HTMLEditor(host.value);
  editor.use(new ToolbarPlugin());
});
onBeforeUnmount(() => editor?.destroy());
</script>
```
