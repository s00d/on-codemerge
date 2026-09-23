# Alpine.js

Alpine for UI chrome; On-Codemerge for the rich-text island. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge alpinejs
```

## Minimal example

```html
<div x-data="ocmEditor()" x-init="init()" x-on:beforeunload.window="destroy()">
  <div x-ref="host" style="min-height: 300px"></div>
  <button type="button" @click="save">Save</button>
</div>

<script type="module">
  import Alpine from 'alpinejs';
  import { Editor, createCorePlugins } from 'on-codemerge';
  import 'on-codemerge/index.css';
  import 'on-codemerge/public.css';

  Alpine.data('ocmEditor', () => ({
    editor: null,
    init() {
      this.editor = new Editor(this.$refs.host, { plugins: createCorePlugins() });
      this.editor.setHTML('<p>Hello from Alpine</p>');
    },
    save() {
      const html = this.editor.getHTML();
      fetch('/api/doc', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html }),
      });
    },
    destroy() {
      this.editor?.destroy();
      this.editor = null;
    },
  }));

  Alpine.start();
</script>
```

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [HTMX host](./htmx.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
