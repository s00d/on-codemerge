---
sidebar_position: 9
---

# Slim

Welcome to the Slim framework-specific documentation for **On-Codemerge**, a versatile web editor designed for easy integration into Slim applications.

## Getting Started with Slim

To integrate On-Codemerge into your Slim application, install the package:

```bash
npm install on-codemerge
```

## Slim Integration Example

Here's how to integrate On-Codemerge into a Slim application:

1. **Frontend Setup**:

```javascript title="public/js/app.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/node_modules/on-codemerge/index.js';
import '/node_modules/on-codemerge/public.css';
import '/node_modules/on-codemerge/index.css';
import '/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class SlimEditor {
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
      this.updateHiddenField(newContent);
      console.log('Content changed:', newContent);
    });

    // Set initial content
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Slim!';
    this.editor.setHtml(initialContent);
  }

  updateHiddenField(content) {
    const hiddenField = document.getElementById('editor-content');
    if (hiddenField) {
      hiddenField.value = content;
    }
  }

  getContent() {
    return this.editor ? this.editor.getHtml() : '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SlimEditor();
});
```

2. **Include the Script in Your Slim View**:

```php title="templates/home.php"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slim On-Codemerge Editor</title>
</head>
<body>
    <div class="container">
        <h1>Slim On-Codemerge Editor</h1>
        
        <form method="post" action="/save-content">
            <div id="editor" style="min-height: 300px;"></div>
            <input type="hidden" id="editor-content" name="content" value="">
            
            <div class="controls">
                <button type="submit">Save Content</button>
                <button type="button" onclick="previewContent()">Preview</button>
            </div>
        </form>
        
        <div id="preview" style="display: none;">
            <h3>Preview:</h3>
            <div id="preview-content"></div>
        </div>
    </div>

    <!-- Initial content (if any) -->
    <script id="initial-content" type="text/plain"><?= htmlspecialchars($initialContent ?? '<p>Welcome to On-Codemerge with Slim!</p>') ?></script>

    <script type="module" src="/js/app.js"></script>
    <script>
        function previewContent() {
            const content = document.getElementById('editor-content').value;
            const previewDiv = document.getElementById('preview');
            const previewContent = document.getElementById('preview-content');
            
            previewContent.innerHTML = content;
            previewDiv.style.display = 'block';
        }
    </script>
</body>
</html>
```

3. **Routing and Controller Setup**:

```php title="routes.php"
<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/vendor/autoload.php';

$app = AppFactory::create();

// Add middleware
$app->addBodyParsingMiddleware();

// Home route
$app->get('/', function (Request $request, Response $response) {
    $initialContent = '<p>Welcome to On-Codemerge with Slim!</p>';
    
    ob_start();
    include __DIR__ . '/templates/home.php';
    $html = ob_get_clean();
    
    $response->getBody()->write($html);
    return $response;
});

// Save content route
$app->post('/save-content', function (Request $request, Response $response) {
    $data = $request->getParsedBody();
    $content = $data['content'] ?? '';
    
    // Save content to database or file
    error_log("Saving content: " . $content);
    
    $response->getBody()->write(json_encode(['success' => true]));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->run();
```

4. **Composer Configuration**:

```json title="composer.json"
{
    "require": {
        "slim/slim": "^4.0",
        "slim/psr7": "^1.0"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    }
}
```

## Key Features

- **Slim Integration**: Full compatibility with Slim 4 framework
- **PSR-7 Support**: Proper HTTP message handling
- **Template Integration**: Easy integration with PHP templates
- **Form Handling**: Built-in form parsing middleware
- **Content Management**: Real-time content updates and saving
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
