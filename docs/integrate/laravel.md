# Laravel

Serve On-Codemerge through **Vite** (not Laravel Mix) and persist document **JSON**.

Verified with Laravel 10 + `laravel-vite-plugin` + `on-codemerge@2.0.3` (`vite build`, `artisan serve`, browser smoke). On this machine PHP 8.1 could not install Laravel 11/12 (they need PHP ≥ 8.2).

## Install

```bash
composer create-project laravel/laravel my-app
cd my-app
npm install on-codemerge
```

## Minimal example

`vite.config.js` input includes the editor entry:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/editor.js'],
      refresh: true,
    }),
  ],
});
```

`resources/js/editor.js` (working smoke file):

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
      headers: {
        'content-type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ doc: editor.getJSON() }),
    });
  });
}
main();
```

Blade:

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
@vite(['resources/js/editor.js'])
<div id="editor" style="min-height:300px"></div>
```

Routes (JSON SoT on disk via Storage):

```php
Route::get('/api/doc', fn () => response()->json(
    json_decode(Storage::disk('local')->get('doc.json'), true)
));

Route::put('/api/doc', function (Request $request) {
    Storage::disk('local')->put(
        'doc.json',
        json_encode(['doc' => $request->input('doc')], JSON_PRETTY_PRINT)
    );
    return ['ok' => true];
});
```

Build: `npm run build` then `php artisan serve`.

## Persist

`PUT /api/doc` with `{ doc: editor.getJSON() }`. Include CSRF header on cookie sessions.

## Gotchas

- Use Vite + `laravel-vite-plugin` — do not resurrect Mix.
- Send `X-CSRF-TOKEN` on mutating requests.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
