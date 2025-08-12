---
sidebar_position: 1
---

# Editor Modes

On-Codemerge supports multiple operating modes to fit different integration scenarios. Each mode provides different levels of isolation and functionality.

## Available Modes

### 1. Direct Mode (Default)
The standard mode where the editor operates directly in the main document.

```typescript
const editor = new HTMLEditor(container);
// or explicitly
const editor = new HTMLEditor(container, { mode: 'direct' });
```

**Use cases:**
- Simple integrations
- Single-page applications
- When no isolation is needed

### 2. Shadow DOM Mode
Provides CSS and DOM isolation using Shadow DOM technology.

```typescript
// Automatic Shadow DOM creation
const editor = new HTMLEditor(container, { mode: 'shadowRoot' });

// Or with existing Shadow DOM
const shadowRoot = container.attachShadow({ mode: 'open' });
const editor = new HTMLEditor(container, { 
  mode: 'shadowRoot',
  shadowRoot: shadowRoot 
});
```

**Use cases:**
- Web Components
- Widgets that need style isolation
- When you want to prevent CSS conflicts

### 3. Iframe Mode
Complete isolation in an iframe element.

```typescript
// Automatic iframe creation
const editor = new HTMLEditor(container, { mode: 'iframe' });

// Or with existing iframe
const iframe = document.createElement('iframe');
container.appendChild(iframe);
const editor = new HTMLEditor(container, { 
  mode: 'iframe',
  iframe: iframe 
});
```

**Use cases:**
- Maximum isolation requirements
- Embedding in third-party websites
- When you need complete separation from the parent page

## Mode Comparison

| Feature | Direct | Shadow DOM | Iframe |
|---------|--------|-------------|---------|
| CSS Isolation | ❌ | ✅ | ✅ |
| DOM Isolation | ❌ | ✅ | ✅ |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Style Conflicts | High | Low | None |
| Integration Complexity | Low | Medium | High |

## Advanced Usage Examples

### Shadow DOM with Custom Shadow Root

```typescript
// Automatic Shadow DOM creation (recommended)
const editor = new HTMLEditor(container, { mode: 'shadowRoot' });

// Or with existing Shadow DOM
const host = document.createElement('div');
const shadowRoot = host.attachShadow({ mode: 'open' });

const editor = new HTMLEditor(host, {
  mode: 'shadowRoot',
  shadowRoot: shadowRoot
});

// Add styles to Shadow DOM
editor.addStyle(`
  .editor-container {
    background: #f5f5f5;
    border: 1px solid #ddd;
  }
`);
```

### Iframe Mode with Custom Styling

```typescript
// Automatic iframe creation (recommended)
const editor = new HTMLEditor(container, { mode: 'iframe' });

// Or with existing iframe
const iframe = document.createElement('iframe');
iframe.style.border = 'none';
iframe.style.width = '100%';
iframe.style.height = '100%';
container.appendChild(iframe);

const editor = new HTMLEditor(container, { 
  mode: 'iframe',
  iframe: iframe 
});

// Wait for iframe to be ready
await editor.waitForIframeReady();

// Now you can work with the editor inside iframe
editor.setHtml('<h1>Hello from iframe!</h1>');
```

### Dynamic Mode Switching

```typescript
// Start with direct mode
let editor = new HTMLEditor(container, { mode: 'direct' });

// Later switch to shadow DOM mode
const shadowRoot = container.attachShadow({ mode: 'open' });
editor = new HTMLEditor(container, { 
  mode: 'shadowRoot',
  shadowRoot: shadowRoot 
});
```

## Style Management

Each mode handles styles differently:

### Direct Mode
```typescript
// Styles are applied to the main document
editor.addStyle(`
  .my-editor {
    background: white;
    border: 2px solid #007acc;
  }
`);
```

### Shadow DOM Mode
```typescript
// Styles are applied to the shadow root
editor.addStyle(`
  .my-editor {
    background: white;
    border: 2px solid #007acc;
  }
`);
// Styles are automatically scoped to the shadow DOM
```

### Iframe Mode
```typescript
// Styles are applied to the iframe document
editor.addStyle(`
  .my-editor {
    background: white;
    border: 2px solid #007acc;
  }
`);
// Styles are completely isolated in the iframe
```

## Best Practices

1. **Choose the right mode** for your use case
2. **Use Shadow DOM** for moderate isolation needs
3. **Use Iframe** only when complete isolation is required
4. **Always wait for iframe readiness** when using iframe mode
5. **Test style conflicts** in your specific environment

## Troubleshooting

### Common Issues

**Styles not applying in Shadow DOM:**
- Ensure styles are added after the editor is initialized
- Check if CSS selectors are specific enough

**Iframe not loading:**
- Always use `await editor.waitForIframeReady()`
- Check if iframe creation is allowed in your environment

**Performance issues:**
- Shadow DOM mode provides good balance of isolation and performance
- Iframe mode may have slight performance overhead due to isolation
