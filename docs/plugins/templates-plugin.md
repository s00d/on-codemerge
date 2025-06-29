# Templates Plugin

The Templates Plugin provides template management capabilities for the on-CodeMerge editor, allowing users to create, save, and apply content templates for faster document creation.

## Features

- **Template Creation**: Create and save content templates
- **Template Library**: Browse and manage template collection
- **Quick Apply**: Apply templates with one click
- **Template Categories**: Organize templates by type
- **Template Preview**: Preview templates before applying
- **Custom Templates**: Create user-defined templates
- **Template Export**: Export and share templates
- **Template Search**: Search through template library
- **Toolbar Integration**: Template menu in toolbar

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, TemplatesPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TemplatesPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['TemplatesPlugin']" />

## API Reference

### Template Methods

```javascript
// Create template
editor.createTemplate('My Template', content, 'custom');

// Apply template
editor.applyTemplate(templateId);

// Get all templates
const templates = editor.getTemplates();

// Delete template
editor.deleteTemplate(templateId);

// Export template
const templateData = editor.exportTemplate(templateId);
```

## Template Categories

- **Document**: Full document templates
- **Section**: Section templates
- **Component**: Reusable components
- **Custom**: User-defined templates

## Events

```javascript
// Listen to template events
editor.on('template:created', (template) => {
  console.log('Template created:', template);
});

editor.on('template:applied', (template) => {
  console.log('Template applied:', template);
});

editor.on('template:deleted', (templateId) => {
  console.log('Template deleted:', templateId);
});
```

## Examples

### Basic Template Usage

```javascript
// Create a template
editor.createTemplate('Blog Post', `
  <h1>Blog Post Title</h1>
  <p>Introduction paragraph...</p>
  <h2>Main Content</h2>
  <p>Content goes here...</p>
  <h3>Conclusion</h3>
  <p>Conclusion paragraph...</p>
`, 'document');

// Apply template
editor.applyTemplate('blog-post-template');
```

### Template Management

```javascript
// Get all templates
const templates = editor.getTemplates();
console.log('Available templates:', templates);

// Delete template
editor.deleteTemplate('old-template');

// Export template
const templateData = editor.exportTemplate('my-template');
console.log('Template data:', templateData);
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, TemplatesPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new TemplatesPlugin());
      
      editorInstance.current.on('template:created', (template) => {
        setTemplates(prev => [...prev, template]);
      });
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  return (
    <div>
      <div>Templates: {templates.length}</div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div>Templates: {{ templates.length }}</div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, TemplatesPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, templates: [] }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new TemplatesPlugin());
    this.editor.on('template:created', template => {
      this.templates.push(template);
    });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.templates-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 20px;
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-item:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.template-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.template-category {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.template-preview {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  line-height: 1.4;
}
```

## Troubleshooting

1. **Template not creating**
   - Check template name uniqueness
   - Verify content is valid HTML
   - Check for JavaScript errors
   - Ensure plugin is initialized

2. **Template not applying**
   - Check if template exists
   - Verify template content
   - Check for conflicts
   - Ensure proper insertion

3. **Template library not loading**
   - Check template storage
   - Verify file permissions
   - Check for network issues
   - Ensure proper initialization

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
