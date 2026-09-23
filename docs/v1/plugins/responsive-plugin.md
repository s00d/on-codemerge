# Responsive Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Responsive Plugin provides responsive design and preview capabilities for the on-CodeMerge editor, allowing users to test and preview content at different screen sizes and breakpoints.

## Features

- **Viewport Simulation**: Preview content at various device sizes
- **Custom Breakpoints**: Add and manage custom breakpoints
- **Toolbar Integration**: Responsive menu in the toolbar
- **Hotkey Support**: Quick viewport switching
- **Live Preview**: Real-time content resizing
- **Device Presets**: Mobile, tablet, desktop, and custom
- **Adaptive Layout**: Editor adapts to selected viewport
- **Event Hooks**: Listen to viewport changes

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ResponsivePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ResponsivePlugin());
```

## Demo
## API Reference

### Responsive Methods

```javascript
// Set viewport
editor.setViewport('mobile');

// Get current viewport
const viewport = editor.getViewport();

// Add custom breakpoint
editor.addBreakpoint('custom', { width: 500, height: 800 });

// List available breakpoints
const breakpoints = editor.getBreakpoints();
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+R` | Open responsive menu | `responsive-menu` |

## Events

```javascript
// Listen to viewport events
editor.on('viewport:changed', (viewport) => {
  console.log('Viewport changed:', viewport);
});

editor.on('breakpoint:added', (breakpoint) => {
  console.log('Breakpoint added:', breakpoint);
});
```

## Examples

### Basic Responsive Preview

```javascript
// Switch to tablet view
editor.setViewport('tablet');

// Add a custom breakpoint
editor.addBreakpoint('wide', { width: 1200, height: 800 });
```

### Device Presets

- Mobile: 375x667
- Tablet: 768x1024
- Desktop: 1440x900
- Custom: Any size


_…trimmed for the v1 archive. See source history for the full guide._
