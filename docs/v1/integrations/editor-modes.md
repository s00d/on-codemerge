# Editor Modes

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
