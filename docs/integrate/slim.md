# Slim

Serve a Vite-built editor and persist document **JSON** with Slim 4.

Verified with Slim 4 + PHP built-in server + Vite + `on-codemerge@2.0.3` (browser smoke).

## Install

```bash
composer require slim/slim slim/psr7
npm install on-codemerge
npm install -D vite
```

## Minimal example

Client (wrap async — no top-level `await` in the default Vite target):

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

async function main() {
  const editor = new Editor(document.getElementById('editor'), {
    plugins: createCorePlugins(),
  });
  const loaded = await fetch('/api/doc').then((r) => r.json());
  editor.setJSON(loaded.doc);
  editor.on('docChanged', () => {
    fetch('/api/doc', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ doc: editor.getJSON() }),
    });
  });
}
main();
```

`public/index.php` (working smoke router):

```php
<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$dataFile = __DIR__ . '/../data/doc.json';

$app->get('/api/doc', function (Request $request, Response $response) use ($dataFile) {
    $response->getBody()->write(file_get_contents($dataFile));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->put('/api/doc', function (Request $request, Response $response) use ($dataFile) {
    $body = $request->getParsedBody();
    file_put_contents($dataFile, json_encode(['doc' => $body['doc']], JSON_PRETTY_PRINT));
    $response->getBody()->write(json_encode(['ok' => true]));
    return $response->withHeader('Content-Type', 'application/json');
});

// also serve public/index.html + /dist/* statically
$app->run();
```

Run: `php -S 127.0.0.1:8000 -t public public/index.php`

## Persist

`{ "doc": editor.getJSON() }` via `PUT /api/doc`.

## Gotchas

- Bundle with Vite; import both CSS files.
- Avoid top-level `await` unless you raise the Vite/build target.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
