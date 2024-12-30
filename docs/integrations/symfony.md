---
sidebar_position: 10
---

# Symfony

Welcome to the Symfony-specific documentation for **On-Codemerge**, an advanced web editor designed for seamless integration into Symfony applications.

## Getting Started with Symfony

To integrate On-Codemerge into your Symfony project, install the package:

```bash
npm install --save on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Symfony Integration Example

Here’s how to integrate On-Codemerge into a Symfony project:

1. **Configure Encore**:

```javascript title="webpack.config.js"
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
const Encore = require('@symfony/webpack-encore');

Encore
    // ... other configurations
    .addEntry('app', './assets/js/app.js')
    // ... other configurations

module.exports = Encore.getWebpackConfig();
```

2. **Initialize On-Codemerge**:

```javascript title="assets/js/app.js"
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
        <!-- Head Contents -->
    </head>
    <body>
        <div id="editor"></div>
        {{ encore_entry_script_tags('app') }}
    </body>
</html>
```

5. **Routing and Controller Setup**: Ensure you have a route and controller set up in Symfony to render the Twig template.
