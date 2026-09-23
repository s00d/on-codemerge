# Laravel

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Laravel-specific documentation for **On-Codemerge**, a powerful web editor designed for seamless integration into Laravel applications.

## Getting Started with Laravel

To use On-Codemerge in a Laravel application, install the package:

```bash
npm install on-codemerge
```

## Laravel Integration Example

Here's how to integrate On-Codemerge into a Laravel project:

1. **Set Up Laravel Mix**:

```javascript title="webpack.mix.js"
const mix = require('laravel-mix');

mix.js('resources/js/app.js', 'public/js')
   .postCss('resources/css/app.css', 'public/css', [])
   .copy('node_modules/on-codemerge/public.css', 'public/css/on-codemerge-public.css')
   .copy('node_modules/on-codemerge/index.css', 'public/css/on-codemerge-index.css')
   .copy('node_modules/on-codemerge/plugins/ToolbarPlugin/style.css', 'public/css/toolbar-plugin.css')
   .copy('node_modules/on-codemerge/plugins/AlignmentPlugin/public.css', 'public/css/alignment-plugin-public.css')
   .copy('node_modules/on-codemerge/plugins/AlignmentPlugin/style.css', 'public/css/alignment-plugin.css');
```

2. **Create the Editor Initialization Script**:

```javascript title="resources/js/app.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

class LaravelEditor {
  constructor() {
    this.editor = null;
    this.init();
  }

  async init() {
    const editorElement = document.getElementById('myEditor');
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
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Laravel!';
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
  new LaravelEditor();
});
```

3. **Compile Your Assets**:

```bash
npm run dev
```

4. **Integrate in Blade Template**:


_…trimmed for the v1 archive. See source history for the full guide._
