---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "OnCodemerge Docs"
  text: "A WYSIWYG editor for on-codemerge"
  actions:
    - theme: brand
      text: Docs
      link: /docs
---

A WYSIWYG editor for on-codemerge is a user-friendly interface that allows users to edit and
view their code in real time, exactly as it will appear in the final product. This intuitive
tool for developers of all skill levels.

---

# Introduction

Welcome to the documentation for **On-Codemerge**, a versatile web editor designed for seamless integration and functionality.

<script setup>
import EditorComponent from './components/EditorComponent.vue';
</script>

<EditorComponent />

## Getting Started

Start by installing **On-Codemerge** in your project.

### Installation

To install `on-codemerge`, run one of the following commands in your project directory, depending on your preferred package manager:

#### Using npm
```bash
npm install --save on-codemerge
```

#### Using yarn
```bash
yarn add on-codemerge
```

#### Using pnpm
```bash
pnpm add on-codemerge
```

#### Using bun
```bash
bun add on-codemerge
```

## Integration Example

Here's a basic example of integrating On-Codemerge into a vanilla JavaScript project:

```typescript
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

import {HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', async () => {
  const appElement = document.getElementById('app');
  if (appElement) {
    const editor = new HTMLEditor(editorElement);

    await editor.setLocale('ru');

    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());
    // ... register other modules

    editor.subscribeToContentChange((newContent?: string) => {
      console.log(newContent)
    });

    // Optional: Set initial content
    editor.setHtml('Your initial content here');
    console.log(editor.getHtml());
  }
});
```

## Available Plugins

On-Codemerge comes with a comprehensive set of plugins that extend its functionality. Each plugin adds unique features to the editor, making it a powerful tool for web content creation and editing.

**[View all available plugins →](/plugins/)**

---

## Supported Locales

**On-Codemerge** supports multiple locales to cater to a global audience. Below is the list of available locales:

| Locale Code | Language             | File Name |
|-------------|----------------------|-----------|
| `ar`        | Arabic               | `ar.json` |
| `cs`        | Czech                | `cs.json` |
| `de`        | German               | `de.json` |
| `en`        | English              | `en.json` |
| `es`        | Spanish              | `es.json` |
| `fr`        | French               | `fr.json` |
| `hi`        | Hindi                | `hi.json` |
| `id`        | Indonesian           | `id.json` |
| `it`        | Italian              | `it.json` |
| `ja`        | Japanese             | `ja.json` |
| `ko`        | Korean               | `ko.json` |
| `nl`        | Dutch                | `nl.json` |
| `pl`        | Polish               | `pl.json` |
| `pt`        | Portuguese           | `pt.json` |
| `ru`        | Russian              | `ru.json` |
| `th`        | Thai                 | `th.json` |
| `tr`        | Turkish              | `tr.json` |
| `vi`        | Vietnamese           | `vi.json` |
| `zh`        | Chinese (Simplified) | `zh.json` |

### Setting a Locale

To set a locale in **On-Codemerge**, use the `setLocale` method:

```typescript
await editor.setLocale('ru'); // Set locale to Russian
```

### Translating Placeholders

You can use placeholders in your translations to dynamically insert values. For example:

```json
{
  "File size exceeds {{max}} limit": "File size exceeds {{max}} limit"
}
```

In your code, you can pass the `max` parameter when translating:

```typescript
editor.t('File size exceeds {{max}} limit', { max: '10MB' });
```

This will output: `File size exceeds 10MB limit`.

### Fallback Locale

If a translation key is missing in the current locale, **On-Codemerge** will fall back to the default locale (`en` by default). You can change the fallback locale using the `setFallbackLocale` method:

```typescript
editor.setFallbackLocale('en'); // Set fallback locale to English
```

### Getting the Current Locale

To retrieve the currently active locale, use the `getCurrentLocale` method:

```typescript
const currentLocale = editor.getCurrentLocale();
console.log(currentLocale); // Outputs: 'ru' (if Russian is set)
```

### Getting Loaded Locales

To get a list of all loaded locales, use the `getLoadedLocales` method:

```typescript
const loadedLocales = editor.getLoadedLocales();
console.log(loadedLocales); // Outputs: ['en', 'ru', 'es']
```
