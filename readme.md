[![npm version](https://badge.fury.io/js/on-codemerge.svg)](https://badge.fury.io/js/on-codemerge)
[![npm downloads](https://img.shields.io/npm/dw/on-codemerge)](https://badge.fury.io/js/on-codemerge)
[![NPM license](https://img.shields.io/npm/l/on-codemerge)](https://github.com/on-org/on-codemerge/blob/master/LICENSE)
[![npm type definitions](https://img.shields.io/npm/types/on-codemerge)](https://github.com/on-org/on-codemerge)
[![GitHub Repo stars](https://img.shields.io/github/stars/s00d/on-codemerge?style=social)](https://github.com/s00d/on-codemerge)

# on-codemerge

Zero dependencies editor

[Docs](https://s00d.github.io/on-codemerge/)

<img src="https://github.com/s00d/on-codemerge/blob/main/branding/repository-open-graph-template_long.png?raw=true" alt="logo">
<img src="https://github.com/s00d/on-codemerge/blob/main/branding/Screenshot1.png?raw=true" alt="logo">
<img src="https://github.com/s00d/on-codemerge/blob/main/branding/Screenshot2.png?raw=true" alt="logo">

## Description

A WYSIWYG editor for on-codemerge is a user-friendly interface that allows users to edit and view their code in real time, exactly as it will appear in the final product. This intuitive tool is designed for developers of all skill levels.

## Installation

To use the editor, include it in your project by importing the main `HTMLEditor` class and any required plugins.

```javascript
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
```

## Setup

Initialize the editor by creating an instance of `HTMLEditor` and passing the target DOM element where the editor should be rendered.

```javascript
const targetElement = document.getElementById('editor');
const editor = new HTMLEditor(targetElement);

// Register plugins
editor.use(new ToolbarPlugin());
editor.use(new AlignmentPlugin());

// To start the editor
editor.init();
```

## Using Plugins

Plugins can be added to enhance the functionality of the editor. Here's an example of how to add a toolbar plugin.

```javascript
import { ToolbarPlugin } from 'on-codemerge';

// After initializing the editor
editor.use(new ToolbarPlugin());
```

## Contribution

Contributions to the editor are welcome. Please ensure that custom plugins and features adhere to the project's architecture and coding standards.

---

For more detailed documentation, please refer to the individual plugin files and the source code of `HTMLEditor`.
