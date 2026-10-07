# Vue 2

`CodeMergeEditor` from `@codemerge/integrate/vue2` (CSS auto).

## Install

```bash
npm install on-codemerge @codemerge/integrate
```

## Value + changes

```vue
<script>
import { CodeMergeEditor } from '@codemerge/integrate/vue2';

export default {
  components: { CodeMergeEditor },
  data() {
    return { html: '<p></p>' };
  },
  methods: {
    onChange(value) {
      this.html = value;
    },
  },
};
</script>

<template>
  <CodeMergeEditor :value="html" format="html" @change="onChange" />
</template>
```

`:host-options` for packs / upload / locale — [Host config](./host-config.md). Load/save: [Persistence](./persistence.md). Composition API: [Vue 3](./vue3.md).
