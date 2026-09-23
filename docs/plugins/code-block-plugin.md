# Code Block Plugin

The Code Block Plugin provides syntax highlighting and code block management for the on-CodeMerge editor, supporting 30+ programming languages.

## Features

- **Syntax Highlighting**: Custom highlighter (no Prism) for 30+ languages
- **Code Block Management**: Insert, edit, and delete code blocks
- **Copy to Clipboard**: One-click copy from the widget header
- **Language Selection**: Choose from supported programming languages
- **Context Menu**: Right-click for edit / copy
- **Modal Editor**: Edit code via modal (widget is not contenteditable)

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, CodeBlockPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(container, {
  plugins: [CodeBlockPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['CodeBlockPlugin']" />

## API Reference

### Commands

```javascript
// Opens the code-block modal. Hotkey: Mod-Alt-q / Ctrl+Alt+Q
editor.command('insertCodeBlock');
```

Edit and copy are available from the code-block context menu. There are no separate `editCodeBlock` / `copyCodeBlock` / `createCodeBlock` commands.

Document changes:

```javascript
editor.on('docChanged', () => {});
editor.on('selectionChanged', () => {});
```

## Keyboard Shortcuts

| Shortcut     | Description       | Command           |
| ------------ | ----------------- | ----------------- |
| `Ctrl+Alt+Q` | Insert code block | `insertCodeBlock` |

## Supported Programming Languages

### Web Development

- **JavaScript** (`javascript`, alias `js`)
- **TypeScript** (`typescript`, alias `ts`)
- **JSX / TSX** (`jsx`, `tsx`)
- **HTML** (`html`)
- **CSS / SCSS** (`css`, `scss`)

### Systems Programming

- **Rust** (`rust`)
- **C++** (`cpp`, `c++`)
- **C** (`c`)

### General Purpose

- **Python** (`python`)
- **Java** (`java`)
- **C#** (`csharp`, `c#`)
- **Go** (`go`)
- **Ruby** (`ruby`)
- **PHP** (`php`)

### Mobile Development

- **Swift** (`swift`)
- **Kotlin** (`kotlin`)
- **Dart** (`dart`)

### JVM Languages

- **Scala** (`scala`)

### Shell Scripting

- **Shell** (`shell`, `bash`, `zsh`)

### Data & Configuration

- **JSON** (`json`)
- **YAML** (`yaml`, `yml`)
- **SQL** (`sql`)

### Documentation

- **Markdown** (`markdown`)

### Scientific Computing

- **R** (`r`)
- **MATLAB** (`matlab`)
- **Julia** (`julia`)

### Functional Programming

- **Haskell** (`haskell`)
- **Elixir** (`elixir`)
- **Erlang** (`erlang`)
- **Clojure** (`clojure`)

### Fallback

- **Plaintext** (`plaintext`) — default for unsupported languages

## Context Menu

Right-click a code block:

- **Edit Code Block** — open modal
- **Copy Code** — clipboard

## HTML boundary (`getHTML` / `setHTML`)

```html
<pre data-language="javascript"><code>console.log("Hello World");</code></pre>
```

Live chrome (`.code-block` header / copy button) is view-only and is not the HTML export shape.

## Troubleshooting

1. Highlighting missing — check `data-language` / attrs.language matches a supported id (or alias).
2. Edit does nothing — use the context menu / modal; the widget itself is not contenteditable.
3. Document not updating — listen to `editor.on('docChanged')`.
