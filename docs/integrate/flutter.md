# Flutter

Host the Vite-built editor in a WebView and bridge **HTML** (or Markdown). Use **`flutter_inappwebview`**.

## Install

```bash
flutter pub add flutter_inappwebview
npm install on-codemerge
```

Ship `assets/editor/` (`index.html`, `editor.js`, `editor.css`) with Vite `base: './'`.

## Web shell

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});

window.ocmLoadHtml = (html) => editor.setHTML(html);
window.ocmLoadMarkdown = (md) => editor.setMarkdown(md);

editor.on('docChanged', () => {
  window.flutter_inappwebview?.callHandler('ocm-save', {
    html: editor.getHTML(),
    md: editor.getMarkdown(),
  });
});
```

## Dart

```dart
InAppWebView(
  initialFile: 'assets/editor/index.html',
  onWebViewCreated: (controller) {
    controller.addJavaScriptHandler(
      handlerName: 'ocm-save',
      callback: (args) {
        final map = Map<String, dynamic>.from(args.first as Map);
        // persist map['html'] or map['md']
        return null;
      },
    );
  },
  onLoadStop: (controller, url) async {
    await controller.evaluateJavascript(
      source: "window.ocmLoadHtml(${jsonEncode(savedHtml)});",
    );
  },
);
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
