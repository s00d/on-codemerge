# Form Builder Plugin

The Form Builder Plugin provides comprehensive form creation and management capabilities for the on-CodeMerge editor. It allows users to build interactive forms with various field types, validation rules, and templates through an intuitive visual interface.

## Features

- **Visual Form Builder**: Drag & drop interface for creating forms
- **Rich Field Types**: Text, email, password, number, tel, url, date, time, datetime-local, textarea, select, checkbox, radio, file, range, color, month, week, hidden, image, submit, reset
- **Enhanced Checkbox Support**: Improved checkbox rendering with proper text alignment and "Checked by Default" option
- **Form Templates**: Pre-built templates for contact forms, registration, surveys, and payments
- **Field Validation**: Built-in validation rules including required, pattern, min/max length, min/max values
- **Real-time Preview**: Live preview of forms as you build them
- **Form Management**: Edit, duplicate, and delete existing forms
- **Context Menu**: Right-click context menu for form operations
- **Keyboard Shortcuts**: Hotkeys for quick form operations
- **Responsive Design**: Mobile-friendly form layouts
- **Accessibility**: ARIA labels and keyboard navigation support
- **Improved UX**: Better notifications, reactive interface updates, and compact option editors

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

## Architecture

The plugin follows a modular architecture with clear separation of concerns:

### Core Components

- **FormBuilderModal**: Main modal for form creation and editing
- **FormPopup**: Quick form insertion popup
- **TemplatesModal**: Template selection modal
- **FieldEditor**: Enhanced field configuration interface with type-specific options
- **FormPreview**: Live form preview component with improved rendering

### Services

- **FormManager**: Central form state management and HTML generation with improved option handling
- **TemplateManager**: Template creation and management
- **FieldBuilder**: Field creation and configuration

### Commands

- **DeleteFormCommand**: Handles form deletion
- **DuplicateFormCommand**: Handles form duplication

## API Reference

### Plugin Methods

```javascript
// Initialize plugin
plugin.initialize(editor);

// Destroy plugin
plugin.destroy();
```

### FormManager Methods

```javascript
// Add field to form
formManager.addField(typeOrField, options);

// Update field with improved option merging
formManager.updateField(fieldId, updates);

// Remove field
formManager.removeField(fieldId);

// Move field
formManager.moveField(fieldId, newPosition);

// Get fields
formManager.getFields();

// Create form configuration
formManager.createFormConfig(action, method);

// Create HTML form
formManager.createForm(formConfig);

// Load form from element
formManager.loadForm(element);

// Parse form element
formManager.parseForm(element);
```

### Field Types

The plugin supports all standard HTML input types:

```typescript
type FieldType =
  | 'text' | 'textarea' | 'select' | 'checkbox' | 'radio'
  | 'button' | 'file' | 'date' | 'time' | 'range' | 'email'
  | 'password' | 'number' | 'tel' | 'url' | 'color'
  | 'datetime-local' | 'month' | 'week' | 'hidden' | 'image'
  | 'submit' | 'reset';
```

### Field Configuration

```typescript
interface FieldConfig {
  id: string;
  type: FieldType;
  label: string;
  options?: FieldOptions;
  validation?: ValidationRules;
  position?: number;
}

interface FieldOptions {
  readonly name?: string;
  readonly id?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly className?: string;
  readonly readonly?: boolean;
  readonly disabled?: boolean;
  readonly multiple?: boolean;
  readonly checked?: boolean; // Enhanced checkbox support
  readonly min?: number | string; // Support for both numbers and dates
  readonly max?: number | string; // Support for both numbers and dates
  readonly step?: number;
  readonly rows?: number;
  readonly cols?: number;
  readonly accept?: string;
  readonly size?: number;
  readonly maxlength?: number;
  readonly minlength?: number;
  readonly src?: string;
  readonly alt?: string;
  readonly options?: readonly string[];
  readonly autocomplete?: 'on' | 'off' | 'name' | 'email' | 'tel' | 'url' | 'current-password' | 'new-password';
}

interface ValidationRules {
  readonly required?: boolean;
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly email?: boolean;
  readonly url?: boolean;
  readonly numeric?: boolean;
  readonly alphanumeric?: boolean;
  readonly custom?: (value: string) => true | string;
}
```

### Form Configuration

```typescript
interface FormConfig {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  action: string;
  enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
  target?: '_blank' | '_self' | '_parent' | '_top';
  className?: string;
  fields: FieldConfig[];
}
```

## Enhanced Checkbox Support

The plugin now includes improved checkbox functionality:

### Checkbox Features

- **Proper Text Alignment**: Checkbox text displays inline with the checkbox using flexbox layout
- **Checkbox Text Field**: Dedicated field for editing checkbox text separate from the main label
- **Checked by Default**: Option to set checkbox as checked by default
- **Improved Rendering**: Better HTML structure with `.checkbox-container` class

### Checkbox Configuration

```javascript
const checkboxField = {
  id: 'terms',
  type: 'checkbox',
  label: 'Terms and Conditions',
  options: {
    name: 'terms',
    value: 'I agree to the terms and conditions', // Checkbox text
    checked: false // Default state
  },
  validation: {
    required: true
  }
};
```

### CSS Classes

The plugin includes new CSS classes for improved styling:

```css
.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-container input[type="checkbox"] {
  margin: 0;
  flex-shrink: 0;
}

.checkbox-container label {
  margin: 0;
  cursor: pointer;
}
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+F` | Insert form | `form` |

## Form Templates

The plugin includes pre-built templates for common use cases. All templates include proper validation with required fields marked appropriately.

### Contact Form Template
- Name field (text) - **Required**
- Email field (email) - **Required**
- Phone field (tel)
- Message field (textarea) - **Required**

### Registration Form Template
- Username field (text) - **Required** (min 3 characters)
- Email field (email) - **Required**
- Password field (password) - **Required** (min 6 characters)
- Confirm Password field (password) - **Required**
- Terms agreement (checkbox) - **Required**

### Survey Form Template
- Name field (text) - **Required**
- Age group (select with options) - **Required**
- Gender (radio buttons) - **Required**
- Suggestions (textarea)
- Service rating (range) - **Required**

### Payment Form Template
- Card number (text) - **Required** (13-19 digits)
- Cardholder name (text) - **Required**
- Expiry date (text) - **Required** (MM/YY format)
- CVV (text) - **Required** (3-4 digits)
- Amount (number) - **Required** (min 0.01)

### Order Form Template
- Product name (text) - **Required**
- Quantity (number) - **Required** (min 1)
- Customer name (text) - **Required**
- Email (email) - **Required**
- Phone (tel) - **Required**
- Delivery address (textarea) - **Required**
- Delivery method (select: Standard, Express, Pickup) - **Required**
- Special instructions (textarea)

### Feedback Form Template
- Your name (text) - **Required**
- Email (email) - **Required**
- Feedback type (select: Bug Report, Feature Request, General Feedback, Complaint, Praise) - **Required**
- Subject (text) - **Required**
- Your feedback (textarea) - **Required**
- Rating (range) - **Required**
- Allow contact (checkbox)

### Resume Form Template
- Full name (text) - **Required**
- Email (email) - **Required**
- Phone (tel) - **Required**
- Position applied for (text) - **Required**
- Work experience (textarea) - **Required**
- Education (textarea)
- Skills (textarea)
- Resume/CV (file upload) - **Required**
- Cover letter (textarea)
- Terms agreement (checkbox) - **Required**

### Booking Form Template
- Full name (text) - **Required**
- Email (email) - **Required**
- Phone (tel) - **Required**
- Booking date (date) - **Required**
- Preferred time (time) - **Required**
- Service type (select: Consultation, Appointment, Meeting, Event, Other) - **Required**
- Number of people (number) - **Required** (min 1)
- Special requirements (textarea)
- Booking confirmation (checkbox) - **Required**

### Newsletter Subscription Template
- First name (text) - **Required**
- Last name (text) - **Required**
- Email address (email) - **Required**
- Newsletter type (select: General, Technology, Business, Lifestyle, All)
- Weekly newsletter (checkbox)
- Monthly newsletter (checkbox)
- Special offers (checkbox)
- Email consent (checkbox) - **Required**

### Customer Satisfaction Survey Template
- Customer name (text) - **Required**
- Email (email) - **Required**
- Product/service used (select) - **Required**
- Overall satisfaction (radio: Very Satisfied to Very Dissatisfied) - **Required**
- Would you recommend us? (radio: Definitely to Definitely Not) - **Required**
- Value for money (radio: Excellent to Very Poor) - **Required**
- What did you like most? (textarea)
- What could we improve? (textarea)
- Feedback permission (checkbox)

### Job Application Form Template
- First name (text) - **Required**
- Last name (text) - **Required**
- Email (email) - **Required**
- Phone (tel) - **Required**
- Position (text) - **Required**
- Experience level (select: Entry Level, Mid Level, Senior Level, Executive) - **Required**
- Why should we hire you? (textarea) - **Required**
- Previous experience (textarea) - **Required**
- Resume (file upload) - **Required**
- Cover letter (file upload)
- Interview availability (checkbox)
- Terms agreement (checkbox) - **Required**

### Support Ticket Form Template
- Full name (text) - **Required**
- Email (email) - **Required**
- Phone (tel) - **Required**
- Issue category (select: Technical Issue, Billing Question, Feature Request, Bug Report, General Inquiry) - **Required**
- Priority level (select: Low, Medium, High, Critical) - **Required**
- Subject (text) - **Required**
- Description of issue (textarea) - **Required**
- Screenshots/attachments (file upload)
- Steps to reproduce (textarea)
- Support terms agreement (checkbox) - **Required**

## Examples

### Basic Form Creation

```javascript
// Create a simple contact form
const formConfig = {
  id: 'contact-form',
  method: 'POST',
  action: '/contact',
  className: 'contact-form',
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Name',
      options: {
        name: 'name',
        placeholder: 'Enter your name'
      },
      validation: {
        required: true
      }
    },
    {
      id: 'email',
      type: 'email',
      label: 'Email',
      options: {
        name: 'email',
        placeholder: 'Enter your email'
      },
      validation: {
        required: true
      }
    }
  ]
};

const formHtml = formManager.createForm(formConfig);
```

### Enhanced Checkbox Form

```javascript
const registrationForm = {
  id: 'registration',
  method: 'POST',
  action: '/register',
  fields: [
    {
      id: 'username',
      type: 'text',
      label: 'Username',
      options: {
        name: 'username',
        placeholder: 'Enter username'
      },
      validation: {
        required: true,
        minLength: 3,
        pattern: '^[a-zA-Z0-9_]+$'
      }
    },
    {
      id: 'terms',
      type: 'checkbox',
      label: 'Terms and Conditions',
      options: {
        name: 'terms',
        value: 'I agree to the terms and conditions',
        checked: false
      },
      validation: {
        required: true
      }
    },
    {
      id: 'newsletter',
      type: 'checkbox',
      label: 'Newsletter',
      options: {
        name: 'newsletter',
        value: 'Subscribe to newsletter',
        checked: true
      },
      validation: {
        required: false
      }
    }
  ]
};
```

### Form with Validation

```javascript
const registrationForm = {
  id: 'registration',
  method: 'POST',
  action: '/register',
  fields: [
    {
      id: 'username',
      type: 'text',
      label: 'Username',
      options: {
        name: 'username',
        placeholder: 'Enter username'
      },
      validation: {
        required: true,
        minLength: 3,
        pattern: '^[a-zA-Z0-9_]+$'
      }
    },
    {
      id: 'age',
      type: 'number',
      label: 'Age',
      options: {
        name: 'age',
        min: 18,
        max: 120
      },
      validation: {
        required: true,
        min: 18,
        max: 120
      }
    }
  ]
};
```

### Select Field with Options

```javascript
const selectField = {
  id: 'country',
  type: 'select',
  label: 'Country',
  options: {
    name: 'country',
    options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France']
  },
  validation: {
    required: true
  }
};
```

## Recent Improvements

### Version 2.0.0

- **Enhanced Checkbox Support**: Improved checkbox rendering with proper text alignment and dedicated text field
- **Fixed Option Merging**: Resolved issues with option updates not preserving existing values
- **Improved Type Safety**: Better TypeScript support with proper readonly properties
- **Better UX**: Compact option editors, improved notifications, and reactive interface updates
- **CSS Improvements**: Added `.checkbox-container` class for proper checkbox layout
- **Bug Fixes**: Fixed checkbox text reset issue when toggling "Checked by Default"

### Key Changes

1. **Checkbox Rendering**: Checkboxes now display text inline using flexbox layout
2. **Option Persistence**: Field options are properly preserved during updates
3. **Type Safety**: Improved TypeScript definitions with proper readonly properties
4. **User Experience**: Better notifications and more responsive interface
5. **Code Quality**: Modular architecture with clear separation of concerns

## Events

The plugin emits various events that you can listen to:

```javascript
// Form creation events
editor.on('form', () => {
  console.log('Form builder opened');
});

editor.on('create-form', () => {
  console.log('Create form triggered');
});

editor.on('show-templates', () => {
  console.log('Templates modal opened');
});

editor.on('edit-form', () => {
  console.log('Edit form triggered');
});

editor.on('duplicate-form', () => {
  console.log('Duplicate form triggered');
});

editor.on('delete-form', () => {
  console.log('Delete form triggered');
});
```

## Styling

The plugin includes comprehensive styling with support for both light and dark themes. Key CSS classes:

- `.form-builder-modal`: Main modal container
- `.form-settings`: Form settings panel
- `.fields-list`: Fields list container
- `.field-editor`: Field editor panel
- `.preview-panel`: Preview panel
- `.preview-content`: Preview content container
- `.generated-form`: Generated form styling
- `.checkbox-container`: Enhanced checkbox layout

### Custom Styling

You can customize the appearance by overriding CSS variables:

```css
:root {
  --border-color: #e5e7eb;
  --error-color: #ef4444;
  --success-color: #10b981;
}
```

## Browser Support

The plugin supports all modern browsers that support:
- ES6+ features
- CSS Grid and Flexbox
- HTML5 form elements
- Drag and Drop API

## Performance

The plugin is optimized for performance with:
- Lazy loading of components
- Efficient DOM manipulation
- Minimal re-renders
- Memory leak prevention through proper cleanup
- Improved option merging to reduce unnecessary updates

## License

MIT License - see LICENSE file for details. 
