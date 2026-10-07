# Kotlin Spring Boot

Same as [Spring Boot](./spring.md): editor in the browser, store **HTML** / Markdown.

## Editor

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});
editor.setHTML('<p>Hello from Kotlin Spring</p>');
editor.on('docChanged', () => {
  const html = editor.getHTML();
  // PUT { html } to your API
});
```

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

Kotlin `@RestController` only needs to accept/return that string field.

## Related

- [Spring Boot](./spring.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
