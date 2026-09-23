# Symfony

Serve a Vite-built editor and persist document **JSON** with Symfony HttpFoundation + Routing (same contract as a full Symfony app controller).

Verified with `symfony/http-foundation` + `symfony/routing` 6.4 + Vite + `on-codemerge@2.0.3` (browser smoke).

## Install

```bash
composer require symfony/http-foundation symfony/routing
npm install on-codemerge
npm install -D vite
```

## Minimal example

Build the editor into `public/dist`. Front controller sketch:

```php
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouteCollection;

$routes = new RouteCollection();
$routes->add('api_get', new Route('/api/doc', ['_controller' => 'api'], [], [], '', [], ['GET']));
$routes->add('api_put', new Route('/api/doc', ['_controller' => 'api'], [], [], '', [], ['PUT']));

// GET -> JsonResponse(json_decode(file_get_contents('data/doc.json'), true))
// PUT -> write { doc: body['doc'] }
```

In a full Symfony app, the same handlers live in a controller + `routes.yaml`. Client is the shared Vite entry using `getJSON` / `setJSON`.

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`.

## Gotchas

- With `php -S … public/index.php`, the router must `return false` for existing static files under `public/dist`, otherwise JS is served as `text/html` and the module fails to load.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
