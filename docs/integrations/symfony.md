---
sidebar_position: 10
---

# Symfony

Welcome to the Symfony-specific documentation for **On-Codemerge**, an advanced web editor designed for seamless integration into Symfony applications.

## Getting Started with Symfony

To integrate On-Codemerge into your Symfony project, install the package:

```bash
npm install on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Symfony Integration Example

Here's how to integrate On-Codemerge into a Symfony project:

1. **Configure Encore**:

```javascript title="webpack.config.js"
const Encore = require('@symfony/webpack-encore');

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')
    .addEntry('app', './assets/js/app.js')
    .enableSingleRuntimeChunk()
    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())
    .enableVersioning(Encore.isProduction())
    .enableSassLoader()
    .splitEntryChunks()
    .enableSingleRuntimeChunk();

module.exports = Encore.getWebpackConfig();
```

2. **Initialize On-Codemerge**:

```javascript title="assets/js/app.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

class SymfonyEditor {
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
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Symfony!';
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
  new SymfonyEditor();
});
```

3. **Build Your Assets**:

```bash
npm run encore dev
```

or

```bash
yarn encore dev
```

4. **Include the Script in Your Twig Template**:

```twig title="templates/base.html.twig"
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{% block title %}Symfony On-Codemerge Editor{% endblock %}</title>
        {{ encore_entry_link_tags('app') }}
    </head>
    <body>
        <div class="container">
            <h1>Symfony On-Codemerge Editor</h1>
            
            <form method="post" action="{{ path('app_save_content') }}">
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
        <script id="initial-content" type="text/plain">{{ initialContent|default('<p>Welcome to On-Codemerge with Symfony!</p>')|raw }}</script>

        {{ encore_entry_script_tags('app') }}
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

5. **Controller Setup**:

```php title="src/Controller/EditorController.php"
<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class EditorController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function home(): Response
    {
        $initialContent = '<p>Welcome to On-Codemerge with Symfony!</p>';
        
        return $this->render('base.html.twig', [
            'initialContent' => $initialContent,
        ]);
    }

    #[Route('/save-content', name: 'app_save_content', methods: ['POST'])]
    public function saveContent(Request $request): JsonResponse
    {
        $content = $request->request->get('content', '');
        
        // Save content to database or file
        // You can inject your service here to handle content saving
        
        return $this->json([
            'success' => true,
            'message' => 'Content saved successfully!'
        ]);
    }
}
```

6. **Entity for Content Storage** (Optional):

```php title="src/Entity/Content.php"
<?php

namespace App\Entity;

use App\Repository\ContentRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ContentRepository::class)]
class Content
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: 'text')]
    private ?string $content = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    // Getters and setters...
}
```

## Key Features

- **Symfony Integration**: Full compatibility with Symfony 6+
- **Webpack Encore**: Modern asset management
- **Twig Templates**: Easy integration with Twig templating
- **Form Handling**: Built-in form processing
- **Entity Support**: Optional Doctrine ORM integration
- **Content Management**: Real-time content updates and saving
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support