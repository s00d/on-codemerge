# Math Plugin

The Math Plugin provides mathematical formula rendering and editing capabilities for the on-CodeMerge editor, supporting LaTeX syntax with interactive features.

## Features

- **LaTeX Support**: Full LaTeX mathematical notation support
- **Interactive Editing**: Click to edit mathematical formulas
- **Drag & Drop**: Move formulas around the document
- **Resizable Formulas**: Interactive resizing with handles
- **Context Menu**: Right-click for quick math operations
- **Toolbar Integration**: Easy access via toolbar button
- **Real-time Rendering**: Instant formula preview
- **Multiple Formats**: Inline and block math support

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, MathPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new MathPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['MathPlugin']" />

## API Reference

### Math Formula Creation

```javascript
// Insert math formula programmatically
editor.executeCommand('math-editor');

// Create math formula with specific LaTeX
const mathElement = createMathFormula('\\frac{a + b}{c}', {
  display: 'block',
  width: 400,
  height: 100
});
```

### Math Operations

```javascript
// Edit existing math formula
editor.executeCommand('editMath', {
  element: mathElement,
  latex: '\\int_{0}^{\\infty} e^{-x} dx'
});

// Resize math formula
editor.executeCommand('resizeMath', {
  element: mathElement,
  width: 500,
  height: 150
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+M` | Insert math formula | `math-editor` |

## LaTeX Syntax Support

### Basic Math Operations
```latex
x + y = z                    % Addition
x - y = z                    % Subtraction
x \times y = z               % Multiplication
\frac{x}{y} = z              % Division
x^2 + y^2 = z^2              % Exponents
\sqrt{x}                     % Square root
\sqrt[n]{x}                  % Nth root
```

### Advanced Mathematical Notation
```latex
\int_{a}^{b} f(x) dx         % Definite integral
\sum_{i=1}^{n} x_i           % Summation
\prod_{i=1}^{n} x_i          % Product
\lim_{x \to \infty} f(x)     % Limit
\frac{d}{dx} f(x)            % Derivative
\partial f                   % Partial derivative
```

### Greek Letters
```latex
\alpha, \beta, \gamma        % Greek letters
\Delta, \Sigma, \Pi          % Capital Greek letters
\theta, \phi, \psi           % More Greek letters
```

### Matrices and Arrays
```latex
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}                % Matrix

\begin{vmatrix}
a & b \\
c & d
\end{vmatrix}                % Determinant

\begin{bmatrix}
x_1 \\
x_2 \\
x_3
\end{bmatrix}                % Column vector
```

### Functions and Operators
```latex
\sin(x), \cos(x), \tan(x)    % Trigonometric functions
\log(x), \ln(x)              % Logarithmic functions
\exp(x)                      % Exponential function
\max(x, y), \min(x, y)       % Max/min functions
```

## Context Menu

Right-click on a math formula to access:

### Math Operations
- **Edit Math**: Open math editor
- **Copy LaTeX**: Copy LaTeX code to clipboard
- **Delete Math**: Remove the formula
- **Duplicate Math**: Create a copy

### Display Options
- **Inline Math**: Convert to inline formula
- **Block Math**: Convert to block formula
- **Center Math**: Center align the formula

### Styling
- **Math Size**: Adjust formula size
- **Math Color**: Change formula color
- **Background**: Set background color

## Math Formula Structure

### HTML Structure
```html
<span class="math-wrapper my-4" draggable="true">
  <div class="math-container" data-math-expression="\frac{a + b}{c}" style="width: 400px; height: 100px;">
    <!-- Rendered math formula -->
  </div>
  <br>
</span>
```

### CSS Classes
- `.math-wrapper`: Container with drag functionality
- `.math-container`: Math formula container
- `.math-editor`: Math editing interface
- `.math-toolbar`: Math editing toolbar

## Events

```javascript
// Listen to math events
editor.on('math:created', (formula) => {
  console.log('Math formula created:', formula);
});

editor.on('math:edited', (formula) => {
  console.log('Math formula edited:', formula);
});

editor.on('math:deleted', (formula) => {
  console.log('Math formula deleted:', formula);
});

editor.on('math:resized', (formula, dimensions) => {
  console.log('Math formula resized:', formula, dimensions);
});

// Drag and drop events
editor.on('drag-start', (event) => {
  console.log('Math drag started:', event);
});

editor.on('drag-end', (event) => {
  console.log('Math drag ended:', event);
});
```

## Examples

### Basic Arithmetic
```latex
2 + 2 = 4
```

### Fractions
```latex
\frac{1}{2} + \frac{1}{3} = \frac{5}{6}
```

### Quadratic Formula
```latex
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```

### Integral
```latex
\int_{0}^{\infty} e^{-x} dx = 1
```

### Summation
```latex
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
```

### Matrix
```latex
\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{pmatrix}
```

### Complex Number
```latex
z = a + bi = r(\cos \theta + i \sin \theta)
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, MathPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new MathPlugin());
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
  <div ref="editorContainer" class="editor-container"></div>
</template>

<script>
import { HTMLEditor, MathPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new MathPlugin());
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
.math-wrapper {
  display: inline-block;
  margin: 0.5rem 0;
  cursor: move;
}

.math-wrapper.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.math-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #ffffff;
  text-align: center;
  transition: all 0.2s ease;
}

.math-container:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.math-editor {
  border: 2px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #f8fafc;
}

.math-toolbar {
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
}
```

### Custom Themes

```css
/* Dark theme */
.math-container.dark-theme {
  background-color: #1f2937;
  color: #f9fafb;
  border-color: #374151;
}

/* Inline math */
.math-container.inline {
  display: inline;
  margin: 0 0.25rem;
  padding: 0.25rem 0.5rem;
}

/* Block math */
.math-container.block {
  display: block;
  margin: 1rem auto;
  text-align: center;
}
```

## Troubleshooting

### Common Issues

1. **Math not rendering**
   - Check if LaTeX syntax is correct
   - Verify math library is loaded
   - Check browser console for errors

2. **Drag and drop not working**
   - Ensure element has `draggable="true"`
   - Check for conflicting event handlers
   - Verify drag events are properly handled

3. **Resize handles not appearing**
   - Make sure math is clicked to activate
   - Check for conflicting CSS styles
   - Verify Resizer component is initialized

4. **LaTeX syntax errors**
   - Check for unmatched braces `{}`
   - Verify backslashes are properly escaped
   - Ensure commands are spelled correctly

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Math plugin initialized');

// Check math events
editor.on('math:created', (formula) => {
  console.log('Math formula created:', formula);
});

// Check LaTeX rendering
editor.on('math:rendered', (latex, element) => {
  console.log('LaTeX rendered:', latex, element);
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Math rendering is done on-demand
- Large formulas may affect performance
- Consider lazy loading for extensive math
- Caching is used for repeated formulas

## Accessibility

- Screen reader support for math content
- Keyboard navigation for math editing
- High contrast themes available
- Proper ARIA labels for math elements

## License

MIT License - see LICENSE file for details. 
