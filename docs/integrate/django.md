# Django

Serve a Vite-built editor and persist document **JSON** with Django.

Verified with Django 5.2 + Vite + `on-codemerge@2.0.3` (browser smoke).

## Install

```bash
pip install django
npm install on-codemerge
npm install -D vite
```

## Minimal example

Build the editor into `public/dist` (same client pattern as Express/Flask). Views (working smoke):

```python
import json
from pathlib import Path
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

DATA = Path(__file__).resolve().parent / 'data' / 'doc.json'
PUBLIC = Path(__file__).resolve().parent / 'public'

def index(_request):
    return FileResponse(open(PUBLIC / 'index.html', 'rb'), content_type='text/html')

def dist(_request, path):
    return FileResponse(open(PUBLIC / 'dist' / path, 'rb'))

@csrf_exempt  # or send CSRF token from the page
@require_http_methods(['GET', 'PUT'])
def api_doc(request):
    if request.method == 'GET':
        return JsonResponse(json.loads(DATA.read_text()))
    body = json.loads(request.body.decode())
    DATA.write_text(json.dumps({'doc': body['doc']}, indent=2))
    return JsonResponse({'ok': True})
```

```python
# urls.py
urlpatterns = [
    path('', views.index),
    path('dist/<path:path>', views.dist),
    path('api/doc', views.api_doc),
]
```

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`.

## Gotchas

- Production apps should use Django’s staticfiles / WhiteNoise instead of hand-rolled `dist/` serving.
- Prefer CSRF tokens over `@csrf_exempt` outside local smoke.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
