# Templates Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
