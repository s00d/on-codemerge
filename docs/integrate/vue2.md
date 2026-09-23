# Vue 2

Embed On-Codemerge in Vue 2.7 (SFC). Persist **JSON** (`getJSON` / `setJSON`), not HTML.

Verified against a Vite + `@vitejs/plugin-vue2` temp app with `on-codemerge@2.0.3`.

## Install

```bash
npm install on-codemerge vue@^2.7
```

Dev tooling used in the smoke: `vite@5`, `@vitejs/plugin-vue2`, `vue-template-compiler@2.7`.

## Minimal example

This is the working SFC from the temp demo (trimmed for the guide):

```vue
<template>
  <div>
    <div ref="host" style="min-height: 300px"></div>
  </div>
</template>

<script>
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const INITIAL = {
  version: 1,
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello from Vue 2' }] }],
  },
};

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new Editor(this.$refs.host, { plugins: createCorePlugins() });
    this.editor.setJSON(INITIAL);
    this.editor.on('docChanged', () => {
      this.$emit('input', this.editor.getJSON());
    });
  },
  beforeDestroy() {
    if (this.editor) this.editor.destroy();
  },
};
</script>
```

```js
// main.js
import Vue from 'vue';
import App from './App.vue';

new Vue({
  render: (h) => h(App),
}).$mount('#app');
```

## Persist

```js
this.editor.on('docChanged', () => {
  const json = this.editor.getJSON();
  // POST / save
});
```

HTML / Markdown are boundaries only.

## Gotchas

- Use an **SFC** (or a full Vue build with template compiler). Runtime-only Vue + string `template:` in `new Vue({…})` failed in smoke (`$refs.host` never mounted; editor threw on `classList`).
- Destroy in `beforeDestroy`.
- Import both `on-codemerge/index.css` and `on-codemerge/public.css`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
