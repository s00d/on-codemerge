# NestJS

Use On-Codemerge in the browser; NestJS only stores the HTML (or Markdown) string you extract.

## Install

```bash
npm install on-codemerge @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/serve-static
```

## Editor (what matters)

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});

const { html } = await fetch('/api/doc').then((r) => r.json());
editor.setHTML(html ?? '<p>Hello from NestJS</p>');

editor.on('docChanged', () => {
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: editor.getHTML() }),
  });
});
```

## Tiny API shape (server is secondary)

```ts
@Controller('api')
export class DocController {
  private html = '<p>Hello from NestJS</p>';

  @Get('doc')
  get() {
    return { html: this.html };
  }

  @Put('doc')
  put(@Body() body: { html: string }) {
    this.html = body.html;
    return { html: this.html };
  }
}
```

Serve the Vite `dist/` with `ServeStaticModule`. Keep the focus on `setHTML` / `getHTML`.

## Related

- [Express.js](./express.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
