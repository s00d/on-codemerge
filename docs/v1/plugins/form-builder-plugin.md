# Form Builder Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
