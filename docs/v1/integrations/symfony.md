# Symfony

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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

_…trimmed for the v1 archive. See source history for the full guide._
