# Host config (plugins, upload, locale)

Document IO is [Persistence](./persistence.md). This page covers **editor construct** control through `@codemerge/integrate`: plugin packs, media upload endpoints, locale, toolbar, and per-plugin server settings.

## What you can control

| Area             | `HostOptions` fields                   | Notes                                             |
| ---------------- | -------------------------------------- | ------------------------------------------------- |
| Document value   | `value`, `format`                      | html / markdown / text                            |
| Chrome           | `chrome`                               | `bar` \| `page`                                   |
| i18n             | `locale`, `fallbackLocale`, `messages` | forwarded to `Editor`                             |
| Theme            | `colorScheme`                          | `host` \| `system`                                |
| Toolbar menus    | `toolbar`                              | `{ menus: [] }` → flat bar                        |
| History          | `history`                              | `maxDepth`, `mergeWindowMs`                       |
| Diagnostics      | `diagnostics`                          | `onMeasure` timing hooks                          |
| Plugin pack      | `pack`                                 | `core` (default) \| `default` \| `none`           |
| Image upload     | `image`                                | `UploadConfig` → ImagePlugin                      |
| File upload      | `fileUpload`                           | only with `pack: 'default'` (or your own plugins) |
| Explicit plugins | `plugins`                              | wins over `pack` / `image` / `fileUpload`         |
| Extra plugins    | `pluginsAppend`                        | e.g. CollaborationPlugin, SpellChecker            |

Helpers: `createEditorHost`, `createHostPlugins` from `@codemerge/integrate`.

Same fields work on:

- `createEditorHost(el, opts)`
- React / Vue / … adapter props (`host-options` on Vue)
- `<ocm-editor>.configure(opts)` / `.options`
- `bindPersistence(plainEl, { load, save, pack, image, … })` when integrate mounts the host

## Upload (image / files)

Packs use the same `UploadConfig` as the plugin docs (`endpoints`, `headers`, `useEmulation`, …).

If you set `endpoints.upload`, integrate defaults `useEmulation: false` (demo in-memory store stays off). Override with `useEmulation: true` only for offline demos.

```ts
import { createEditorHost } from '@codemerge/integrate';

createEditorHost(el, {
  pack: 'default', // includes FileUploadPlugin; 'core' has ImagePlugin only
  image: {
    endpoints: { upload: '/api/media', list: '/api/media', delete: '/api/media' },
    headers: () => ({
      'X-CSRF-TOKEN':
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
    }),
    maxFileSize: 10 * 1024 * 1024,
  },
  fileUpload: {
    endpoints: {
      upload: '/api/files',
      download: '/api/files',
      list: '/api/files',
      delete: '/api/files',
    },
  },
});
```

`headers` as a function is resolved **once at mount** (handy for CSRF).

Without integrate sugar, same thing:

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge';

new Editor(el, {
  plugins: createDefaultPlugins({
    image: { endpoints: { upload: '/api/media' }, useEmulation: false },
    fileUpload: { endpoints: { upload: '/api/files' }, useEmulation: false },
  }),
});
```

## Per-plugin server settings

Upload is the common case, so it has first-class `image` / `fileUpload` on packs. Everything else (collab WS, spell dictionaries, custom AI endpoints, …) goes through **plugin constructors**:

| Need                     | How                                                             |
| ------------------------ | --------------------------------------------------------------- |
| Media / file URLs + CSRF | `image` / `fileUpload` on pack                                  |
| Collaboration            | `pluginsAppend: [CollaborationPlugin({ serverUrl, getToken })]` |
| Spellcheck dictionaries  | `pluginsAppend: [SpellCheckerPlugin({ dictionaries: … })]`      |
| Replace / reorder pack   | `plugins: […]` (full list; `pack` ignored)                      |
| Pack + one extra         | `pack: 'default'` + `pluginsAppend`                             |

```ts
import { CollaborationPlugin, SpellCheckerPlugin } from 'on-codemerge/plugins';
import { createEditorHost } from '@codemerge/integrate';

createEditorHost(el, {
  pack: 'default',
  image: { endpoints: { upload: '/api/media' } },
  pluginsAppend: [
    CollaborationPlugin({
      serverUrl: 'wss://example.com/collab',
      docId: 'page-42',
      getToken: () => fetchToken(),
    }),
    SpellCheckerPlugin({/* dictionary file URLs — see SpellChecker plugin docs */}),
  ],
});
```

Full control without packs:

```ts
import { createDefaultPlugins, CollaborationPlugin } from 'on-codemerge/plugins';

createEditorHost(el, {
  plugins: [
    ...createDefaultPlugins({
      image: { endpoints: { upload: '/api/media' } },
    }),
    CollaborationPlugin({ serverUrl: 'wss://…', getToken }),
  ],
});
```

## React

```tsx
<CodeMergeEditor
  pack="default"
  image={{ endpoints: { upload: '/api/media' } }}
  fileUpload={{ endpoints: { upload: '/api/files' } }}
  locale="ru"
  value={html}
  onChange={setHtml}
/>
```

## Vue 3

Pass a bag via `host-options`:

```vue
<CodeMergeEditor
  :value="html"
  :host-options="{
    pack: 'default',
    image: { endpoints: { upload: '/api/media' } },
    locale: 'ru',
  }"
  @change="onChange"
/>
```

## Web Component

Set options **before** connect, or call `configure()`:

```js
import '@codemerge/integrate/element';

const el = document.createElement('ocm-editor');
el.configure({
  pack: 'default',
  image: {
    endpoints: { upload: '/api/media' },
    headers: () => ({ Authorization: `Bearer ${token}` }),
  },
  locale: 'en',
});
document.body.append(el); // or set `.options` before first connect
```

If the element is **already in the DOM**, register `ready` **before** `configure()` (`ready` can fire synchronously on remount).

Attrs still work for simple fields: `value`, `format`, `chrome`, `locale`, `pack`.

## Persistence + upload together

```js
import '@codemerge/integrate/element';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

const el = document.querySelector('ocm-editor');

function wire() {
  bindPersistence(
    el,
    restPersistence({
      url: `/pages/${id}`,
      parse: (d) => d.content,
      serialize: (value) => ({ content: value }),
    })
  );
}

// Listen before configure — `ready` fires synchronously on remount.
el.addEventListener('ready', wire, { once: true });
el.configure({
  pack: 'default',
  image: { endpoints: { upload: '/api/media' } },
});
```

When `bindPersistence` mounts a **plain** element, pass the same host fields on the persistence options (`pack`, `image`, …).

## Related

- [Persistence](./persistence.md)
- [Server + Vite](./server-vite.md)
- [Image plugin](/plugins/image-plugin)
- [File upload plugin](/plugins/file-upload-plugin)
- [Collaboration](/plugins/collaboration-plugin)
- [Spell checker](/plugins/spell-checker-plugin)
