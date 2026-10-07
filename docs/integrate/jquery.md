# jQuery

Still ubiquitous on the open web. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge jquery
```

## Minimal example

```html
<div id="editor" style="min-height: 300px"></div>
<script type="module">
  import $ from 'jquery';
  import { Editor, createCorePlugins } from 'on-codemerge';
  import 'on-codemerge/index.css';
  import 'on-codemerge/public.css';

  const editor = new Editor($('#editor')[0], { plugins: createCorePlugins() });
  editor.setHTML('<p>Hello from jQuery</p>');

  $('#save').on('click', () => {
    const html = editor.getHTML();
    $.ajax({
      url: '/api/doc',
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ html }),
    });
  });
</script>
```

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Pass a raw DOM node (`$('#editor')[0]`), not a jQuery object, to `new Editor`.
- Prefer bundling with Vite over CDN globals for ESM + CSS.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
