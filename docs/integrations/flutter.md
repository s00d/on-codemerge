---
sidebar_position: 16
---

# Flutter

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
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'https://unpkg.com/on-codemerge@latest/index.js';
import 'https://unpkg.com/on-codemerge@latest/public.css';
import 'https://unpkg.com/on-codemerge@latest/index.css';
import 'https://unpkg.com/on-codemerge@latest/plugins/ToolbarPlugin/style.css';
import 'https://unpkg.com/on-codemerge@latest/plugins/AlignmentPlugin/public.css';
import 'https://unpkg.com/on-codemerge@latest/plugins/AlignmentPlugin/style.css';

class FlutterEditor {
  constructor() {
    this.editor = null;
    this.init();
  }

  async init() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) return;

    // Initialize editor
    this.editor = new HTMLEditor(editorElement);

    // Set locale
    await this.editor.setLocale('ru');

    // Register plugins
    this.editor.use(new ToolbarPlugin());
    this.editor.use(new AlignmentPlugin());

    // Subscribe to content changes
    this.editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
      if (window.flutter_inappwebview) {
        window.flutter_inappwebview.callHandler('contentChanged', newContent);
      }
    });

    // Set initial content
    this.editor.setHtml('<p>Welcome to On-Codemerge with Flutter!</p>');

    // Make editor instance globally available
    window.editorInstance = this.editor;
  }

  setContent(content) {
    if (this.editor) {
      this.editor.setHtml(content);
    }
  }

  getContent() {
    return this.editor ? this.editor.getHtml() : '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FlutterEditor();
});
```

3. **Flutter Widget**:

```dart title="lib/editor_widget.dart"
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:convert';

class OnCodemergeEditor extends StatefulWidget {
  final String initialContent;
  final Function(String) onContentChanged;
  final Function(String) onSave;

  const OnCodemergeEditor({
    Key? key,
    this.initialContent = '<p>Welcome to On-Codemerge with Flutter!</p>',
    required this.onContentChanged,
    required this.onSave,
  }) : super(key: key);

  @override
  State<OnCodemergeEditor> createState() => _OnCodemergeEditorState();
}

class _OnCodemergeEditorState extends State<OnCodemergeEditor> {
  late WebViewController _controller;
  String _currentContent = '';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar
          },
          onPageFinished: (String url) {
            // Page loaded, set initial content
            _setInitialContent();
          },
        ),
      )
      ..addJavaScriptChannel(
        'contentChanged',
        onMessageReceived: (JavaScriptMessage message) {
          _currentContent = message.message;
          widget.onContentChanged(_currentContent);
        },
      )
      ..addJavaScriptChannel(
        'saveContent',
        onMessageReceived: (JavaScriptMessage message) {
          widget.onSave(message.message);
        },
      )
      ..addJavaScriptChannel(
        'loadContent',
        onMessageReceived: (JavaScriptMessage message) {
          // Handle load content request
        },
      )
      ..addJavaScriptChannel(
        'getContent',
        onMessageReceived: (JavaScriptMessage message) {
          _currentContent = message.message;
          widget.onContentChanged(_currentContent);
        },
      )
      ..loadFlutterAsset('assets/editor.html');
  }

  void _setInitialContent() {
    final encodedContent = base64Encode(utf8.encode(widget.initialContent));
    _controller.runJavaScript(
      'window.editorInstance.setHtml(atob("$encodedContent"));',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('On-Codemerge Editor'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: () {
              _controller.runJavaScript('saveContent();');
            },
          ),
        ],
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
```

4. **Main App**:

```dart title="lib/main.dart"
import 'package:flutter/material.dart';
import 'editor_widget.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter On-Codemerge',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const EditorPage(),
    );
  }
}

class EditorPage extends StatefulWidget {
  const EditorPage({Key? key}) : super(key: key);

  @override
  State<EditorPage> createState() => _EditorPageState();
}

class _EditorPageState extends State<EditorPage> {
  String _content = '<p>Welcome to On-Codemerge with Flutter!</p>';

  void _onContentChanged(String content) {
    setState(() {
      _content = content;
    });
    print('Content changed: $content');
  }

  void _onSave(String content) {
    // Save content to local storage or send to server
    print('Saving content: $content');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Content saved!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return OnCodemergeEditor(
      initialContent: _content,
      onContentChanged: _onContentChanged,
      onSave: _onSave,
    );
  }
}
```

5. **Pubspec.yaml Configuration**:

```yaml title="pubspec.yaml"
name: flutter_on_codemerge
description: Flutter app with On-Codemerge editor

publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^4.0.0
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/editor.html
    - assets/editor.js
```

## Key Features

- **Flutter Integration**: Full compatibility with Flutter WebView
- **JavaScript Bridge**: Seamless communication between Flutter and WebView
- **Content Management**: Real-time content updates and saving
- **Mobile Optimized**: Responsive design for mobile devices
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support 