# Flutter

Host the Vite-built editor inside a WebView and bridge **JSON** both ways.

Verified: web asset build + browser smoke (`Flutter JSON SoT` screenshot). Dart uses **`flutter_inappwebview`** (not `webview_flutter`) for `addJavaScriptHandler` / `evaluateJavascript`.

## Install

```bash
flutter pub add flutter_inappwebview
npm install on-codemerge
npm install -D vite
```

Ship built files under `assets/editor/` (`index.html`, `editor.js`, `editor.css`) and register them in `pubspec.yaml`.

## Minimal example

Web shell (working smoke `editor.js`):

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});

window.ocmLoad = (doc) => editor.setJSON(doc);

editor.on('docChanged', () => {
  const doc = editor.getJSON();
  window.flutter_inappwebview?.callHandler('ocm-save', doc);
});
```

Dart host:

```dart
InAppWebView(
  initialFile: 'assets/editor/index.html',
  onWebViewCreated: (controller) {
    controller.addJavaScriptHandler(
      handlerName: 'ocm-save',
      callback: (args) {
        final doc = Map<String, dynamic>.from(args.first as Map);
        // persist JSON
        return null;
      },
    );
  },
  onLoadStop: (controller, url) async {
    await controller.evaluateJavascript(
      source: 'window.ocmLoad(${jsonEncode(savedDoc)});',
    );
  },
);
```

## Persist

SoT is the JSON map from `getJSON` / `ocm-save`. Do not store HTML from the WebView.

## Gotchas

- Use `flutter_inappwebview` for named JS handlers; older `webview_flutter`-only samples do not match this bridge.
- Build with Vite `base: './'` for asset paths inside the WebView.
- Load JSON via `window.ocmLoad(...)`, not `setHTML`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
