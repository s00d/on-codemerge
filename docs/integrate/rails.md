# Ruby on Rails

Serve a Vite-built editor from `public/` and persist document **JSON** via a Rails API controller.

Verified client + `GET/PUT /api/doc` with screenshot smoke. Full `rails new` failed on this machine (OpenSSL extension linked to an incompatible `libruby`), so the live smoke server was WEBrick mounting the same routes; the controller below is the Rails form of that API.

## Install

```bash
rails new my-app --api
cd my-app
npm install on-codemerge
npm install -D vite
```

Build the editor into `public/dist` (same Vite entry as Express).

## Minimal example

```ruby
# config/routes.rb
Rails.application.routes.draw do
  get '/api/doc', to: 'docs#show'
  put '/api/doc', to: 'docs#update'
end
```

```ruby
# app/controllers/docs_controller.rb
class DocsController < ApplicationController
  DATA = Rails.root.join('data/doc.json')

  def show
    render json: JSON.parse(File.read(DATA))
  end

  def update
    body = JSON.parse(request.body.read)
    File.write(DATA, JSON.pretty_generate({ doc: body['doc'] }))
    render json: { ok: true }
  end
end
```

Put `public/index.html` + `public/dist/*` from the Vite build next to the Rails app (or use js-bundling-rails / vite-ruby).

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`.

## Gotchas

- Skip CSRF for pure JSON API controllers, or send the CSRF token from the page.
- Persist JSON, not HTML.
- If `rails new` / gems fail on a broken local Ruby/OpenSSL, the HTTP contract above is still what to implement.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
