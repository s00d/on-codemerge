---
sidebar_position: 8
---

# Laravel

Welcome to the Laravel-specific documentation for **On-Codemerge**, a powerful web editor designed for seamless integration into Laravel applications.

## Getting Started with Laravel

To use On-Codemerge in a Laravel application, install the package:

```bash
npm install --save on-codemerge
```

## Laravel Integration Example

Here's how to integrate On-Codemerge into a Laravel project:

1. **Set Up Laravel Mix**:

```javascript title="webpack.mix.js"
const mix = require('laravel-mix');

mix.js('resources/js/app.js', 'public/js')
   .postCss('resources/css/app.css', 'public/css', []);
```

2. **Create the Editor Initialization Script**:

```javascript title="resources/js/app.js"
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', async () => {
  const editorElement = document.getElementById('myEditor');
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

3. **Compile Your Assets**:

```bash
npm run dev
```

4. **Integrate in Blade Template**:

```blade title="welcome.blade.php"
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Head Contents -->
</head>
<body>
    <div id="myEditor"></div>

    <script src="{{ mix('js/app.js') }}"></script>
</body>
</html>
```
