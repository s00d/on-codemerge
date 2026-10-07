# Vue 2

Embed On-Codemerge in Vue 2.7 (SFC). Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge vue@^2.7
```

## Minimal example

```vue
<template>
  <div ref="host" style="min-height: 300px"></div>
</template>

<script>
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export default {
  name: 'MyEditor',
  props: { value: { type: String, default: '<p>Hello from Vue 2</p>' } },
  mounted() {
    this.editor = new Editor(this.$refs.host, { plugins: createCorePlugins() });
    this.editor.setHTML(this.value);
    this.editor.on('docChanged', () => {
      this.$emit('input', this.editor.getHTML());
    });
  },
  beforeDestroy() {
    if (this.editor) this.editor.destroy();
  },
  watch: {
    value(next) {
      if (!this.editor || this.editor.getHTML() === next) return;
      this.editor.setHTML(next);
    },
  },
};
</script>
```

Use an SFC (runtime-only Vue + string `template:` failed in smoke). Vue 2 `v-model` is `value` + `input`.

### Extract

```js
const html = this.editor.getHTML();
const md = this.editor.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
