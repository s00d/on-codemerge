# Flutter

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Flutter-specific documentation for **On-Codemerge**, a versatile web editor designed for integration with Flutter applications using WebView.

## Getting Started with Flutter

To integrate On-Codemerge into your Flutter application, add the webview_flutter dependency:

```bash
flutter pub add webview_flutter
```

## Flutter Integration Example

Here's how to integrate On-Codemerge into a Flutter application:

1. **Create HTML Template**:

```html title="assets/editor.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flutter On-Codemerge Editor</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        #editor {
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 20px 0;
            min-height: 300px;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            padding: 8px 16px;
            margin-right: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f8f9fa;
            cursor: pointer;
        }
        button:hover {
            background: #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Flutter On-Codemerge Editor</h1>
        <div class="controls">
            <button onclick="saveContent()">Save Content</button>
            <button onclick="loadContent()">Load Content</button>
            <button onclick="getContent()">Get Content</button>
        </div>
        <div id="editor"></div>
    </div>

    <script type="module" src="editor.js"></script>
    <script>
        function saveContent() {
            if (window.flutter_inappwebview) {
                const content = window.editorInstance ? window.editorInstance.getHtml() : '';
                window.flutter_inappwebview.callHandler('saveContent', content);
            }
        }

        function loadContent() {
            if (window.flutter_inappwebview) {
                window.flutter_inappwebview.callHandler('loadContent');
            }
        }

        function getContent() {
            if (window.flutter_inappwebview) {
                const content = window.editorInstance ? window.editorInstance.getHtml() : '';
                window.flutter_inappwebview.callHandler('getContent', content);
            }
        }
    </script>
</body>
</html>
```

2. **Create JavaScript for Editor**:

```javascript title="assets/editor.js"

_…trimmed for the v1 archive. See source history for the full guide._
