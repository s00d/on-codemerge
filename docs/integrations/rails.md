---
sidebar_position: 12
---

# Rails

Welcome to the Ruby on Rails-specific documentation for **On-Codemerge**, a dynamic web editor designed for seamless integration with Ruby on Rails.

## Getting Started with Ruby on Rails

To use On-Codemerge in your Ruby on Rails project, install the package:

```bash
yarn add on-codemerge
```

## Ruby on Rails Integration Example

### Webpacker Integration (Rails 6+)

1. **Create a JavaScript Pack**:

```javascript title="app/javascript/packs/editor.js"
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

2. **Include the Pack in Your View**:

```erb title="app/views/layouts/application.html.erb"
<!DOCTYPE html>
<html>
<head>
  <%= javascript_pack_tag 'editor', 'data-turbolinks-track': 'reload' %>
  <!-- Other head elements -->
</head>
<body>
  <%= yield %>
</body>
</html>
```

### Asset Pipeline Integration

1. **Add JavaScript Files**: Place your JavaScript files, including `on-codemerge` and its dependencies, in `app/assets/javascripts`.

2. **Require Files in Application.js**:

```javascript title="app/assets/javascripts/application.js"
//= require on-codemerge
//= require textStylingButton
//= require tableButton
// Other requires
```

3. **Initialize On-Codemerge in Your View**:

```erb title="app/views/your_view.html.erb"
<div id="editor"></div>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Initialization code as shown above
  });
</script>
```
