---
sidebar_position: 9
---

# Slim

Welcome to the Slim framework-specific documentation for **On-Codemerge**, a versatile web editor designed for easy integration into Slim applications.

## Getting Started with Slim

To integrate On-Codemerge into your Slim application, install the package:

```bash
npm install --save on-codemerge
```

## Slim Integration Example

Here’s how to integrate On-Codemerge into a Slim application:

1. **Frontend Setup**:

```javascript title="public/js/app.js"
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', async () => {
  const editorElement = document.getElementById('editor');
  if (editorElement) {
    const editor = new HTMLEditor(editorElement);

    await editor.setLocale('ru');

    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());

    editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
    });

    editor.setHtml('Initial content goes here');
    console.log(editor.getHtml());
  }
});
```

2. **Include the Script in Your Slim View**:

```php title="templates/home.php"
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Head Contents -->
</head>
<body>
    <div id="editor"></div>

    <script src="/js/app.js"></script>
</body>
</html>
```

3. **Routing and Rendering the View**:

```php title="routes.php"
$app->get('/', function ($request, $response, $args) {
    return $this->get('view')->render($response, 'home.php');
});
```
