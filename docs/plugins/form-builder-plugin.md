# Form Builder Plugin

The Form Builder Plugin provides comprehensive form creation and management capabilities for the on-CodeMerge editor, allowing users to build interactive forms with various field types and validation.

## Features

- **Form Creation**: Build forms with drag & drop interface
- **Field Types**: Text, email, number, select, checkbox, radio, textarea
- **Field Validation**: Built-in validation rules and custom validation
- **Form Styling**: Customizable form appearance
- **Field Groups**: Organize fields into logical groups
- **Form Templates**: Pre-built form templates
- **Form Export**: Export forms as HTML or JSON
- **Responsive Design**: Mobile-friendly form layouts
- **Accessibility**: ARIA labels and keyboard navigation

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FormBuilderPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FormBuilderPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['FormBuilderPlugin']" />

## API Reference

### Form Methods

```javascript
// Create new form
const form = formBuilder.createForm();

// Add field to form
formBuilder.addField(formId, fieldConfig);

// Update field
formBuilder.updateField(formId, fieldId, fieldConfig);

// Remove field
formBuilder.removeField(formId, fieldId);

// Get form data
const formData = formBuilder.getFormData(formId);

// Export form
const htmlForm = formBuilder.exportForm(formId, 'html');
```

### Field Configuration

```javascript
interface FieldConfig {
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  validation?: ValidationRule[];
  options?: string[]; // For select/radio fields
  defaultValue?: any;
}
```

## Field Types

### Text Input
```html
<input type="text" name="username" placeholder="Enter username" required>
```

### Email Input
```html
<input type="email" name="email" placeholder="Enter email" required>
```

### Number Input
```html
<input type="number" name="age" min="0" max="120" placeholder="Enter age">
```

### Select Dropdown
```html
<select name="country" required>
  <option value="">Select country</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>
```

### Checkbox
```html
<input type="checkbox" name="newsletter" value="yes">
<label>Subscribe to newsletter</label>
```

### Radio Buttons
```html
<input type="radio" name="gender" value="male">
<label>Male</label>
<input type="radio" name="gender" value="female">
<label>Female</label>
```

### Textarea
```html
<textarea name="message" rows="4" placeholder="Enter your message"></textarea>
```

## Events

```javascript
// Listen to form events
editor.on('form:created', (form) => {
  console.log('Form created:', form);
});

editor.on('field:added', (field) => {
  console.log('Field added:', field);
});

editor.on('field:updated', (field) => {
  console.log('Field updated:', field);
});

editor.on('form:submitted', (formData) => {
  console.log('Form submitted:', formData);
});
```

## Examples

### Basic Form Creation

```javascript
// Create a contact form
const contactForm = formBuilder.createForm({
  title: 'Contact Form',
  description: 'Please fill out the form below'
});

// Add fields
formBuilder.addField(contactForm.id, {
  type: 'text',
  label: 'Name',
  name: 'name',
  required: true,
  placeholder: 'Enter your name'
});

formBuilder.addField(contactForm.id, {
  type: 'email',
  label: 'Email',
  name: 'email',
  required: true,
  placeholder: 'Enter your email'
});

formBuilder.addField(contactForm.id, {
  type: 'textarea',
  label: 'Message',
  name: 'message',
  required: true,
  placeholder: 'Enter your message'
});
```

### Form with Validation

```javascript
// Create form with validation
const registrationForm = formBuilder.createForm({
  title: 'User Registration'
});

formBuilder.addField(registrationForm.id, {
  type: 'text',
  label: 'Username',
  name: 'username',
  required: true,
  validation: [
    { type: 'minLength', value: 3, message: 'Username must be at least 3 characters' },
    { type: 'pattern', value: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores' }
  ]
});

formBuilder.addField(registrationForm.id, {
  type: 'email',
  label: 'Email',
  name: 'email',
  required: true,
  validation: [
    { type: 'email', message: 'Please enter a valid email address' }
  ]
});
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, FormBuilderPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new FormBuilderPlugin());
      
      // Track form events
      editorInstance.current.on('form:created', (form) => {
        setForms(prev => [...prev, form]);
      });
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
      }
    };
  }, []);

  return <div ref={editorRef} className="editor-container" />;
}
```

### Vue Integration

```vue
<template>
  <div>
    <div class="form-list" v-if="forms.length">
      <h3>Created Forms:</h3>
      <ul>
        <li v-for="form in forms" :key="form.id">{{ form.title }}</li>
      </ul>
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { HTMLEditor, FormBuilderPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  data() {
    return {
      editor: null,
      forms: []
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new FormBuilderPlugin());
    
    this.editor.on('form:created', (form) => {
      this.forms.push(form);
    });
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Styling

### Default Styles

```css
/* Form container */
.form-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

/* Form fields */
.form-field {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Form buttons */
.form-button {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.form-button:hover {
  background-color: #1d4ed8;
}

/* Validation styles */
.form-input.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}
```

## Troubleshooting

### Common Issues

1. **Form not creating**
   - Check plugin initialization
   - Verify form builder is working
   - Check for JavaScript errors
   - Ensure proper permissions

2. **Fields not adding**
   - Check field configuration
   - Verify field types are supported
   - Check for validation errors
   - Ensure form ID is valid

3. **Validation not working**
   - Check validation rules syntax
   - Verify validation types are supported
   - Check for JavaScript errors
   - Ensure validation is enabled

### Debug Mode

```javascript
// Add console logging
console.log('Form Builder plugin initialized');

// Check form events
editor.on('form:created', (form) => {
  console.log('Form created:', form);
});

// Check field events
editor.on('field:added', (field) => {
  console.log('Field added:', field);
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
