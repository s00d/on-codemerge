# AI Assistant Plugin

The AI Assistant Plugin provides AI-powered content generation capabilities for the on-CodeMerge editor, supporting multiple AI providers and models for automated content creation.

## Features

- **Multiple AI Providers**: Support for OpenAI, DeepSeek, HuggingFace, GitHub Azure, Llama, Mistral, and Ollama
- **Customizable Prompts**: Configurable prompts and structure templates
- **API Key Management**: Secure storage and management of API keys
- **Content Generation**: Generate HTML-formatted content for direct insertion
- **Driver Options**: Model-specific configuration options
- **Settings Persistence**: Automatic saving of user preferences
- **Popup Interface**: User-friendly configuration interface

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, AIAssistantPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new AIAssistantPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>
<EditorComponent :activePlugins="['AIAssistantPlugin']" />

## API Reference

### Plugin Initialization

```javascript
const aiPlugin = new AIAssistantPlugin();
editor.use(aiPlugin);
```

### Generate Content

```javascript
// Generate content programmatically
const result = await aiPlugin.generateContent({
  prompt: 'Write about web development',
  driver: 'openai',
  apiKey: 'your-api-key',
  options: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  }
});
```

## Supported AI Providers

### OpenAI
- **Models**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Features**: High-quality text generation, code assistance
- **Configuration**: API key, model selection, temperature, max tokens

### DeepSeek
- **Models**: DeepSeek-Coder, DeepSeek-Chat
- **Features**: Code-focused generation, technical content
- **Configuration**: API key, model selection, temperature, max tokens

### HuggingFace
- **Models**: Various open-source models
- **Features**: Free tier available, diverse model options
- **Configuration**: API key, model selection, temperature, max tokens

### GitHub Azure
- **Models**: GitHub Copilot models
- **Features**: Code generation, GitHub integration
- **Configuration**: API key, model selection, temperature, max tokens

### Llama
- **Models**: Llama 2, Llama 3
- **Features**: Open-source models, local deployment possible
- **Configuration**: API key, model selection, temperature, max tokens

### Mistral
- **Models**: Mistral 7B, Mixtral 8x7B
- **Features**: High-performance open models
- **Configuration**: API key, model selection, temperature, max tokens

### Ollama
- **Models**: Local models via Ollama
- **Features**: Local deployment, privacy-focused
- **Configuration**: API key, model selection, temperature, max tokens

## Configuration Interface

The plugin provides a popup interface with the following fields:

### Basic Settings
- **AI Driver**: Select the AI provider (openai, deepseek, huggingface, github, llama, mistral, ollama)
- **API Key**: Enter your API key for the selected provider
- **Structure Prompt**: Define how the AI should format the response
- **Prompt**: The main prompt for content generation

### Driver-Specific Options
Each driver supports custom options:

```javascript
// OpenAI options
{
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1.0
}

// DeepSeek options
{
  model: 'deepseek-coder',
  temperature: 0.5,
  maxTokens: 2000
}

// HuggingFace options
{
  model: 'gpt2',
  temperature: 0.8,
  maxTokens: 500
}
```

## Default Prompts

### Default Content Prompt
```
Write an article about the benefits of using artificial intelligence in web development. Include examples of JavaScript code and explain how AI can simplify the development process.
```

### Default Structure Prompt
```
The response should be formatted as HTML code that can be inserted into a text editor. Follow these rules:
1. Headings should be wrapped in <h1>, <h2>, <h3>, etc.
2. Paragraphs should be wrapped in <p>.
3. Lists should use <ul>, <ol>, and <li>.
4. Code should be wrapped in <pre><code>.
5. Use <strong> and <em> for emphasis.
6. For images, use the <img> tag with the src attribute.
7. Links should use the <a> tag.
8. Tables should use <table>, <tr>, <th>, and <td>.
9. Do not include unnecessary tags like <html>, <head>, or <body>.
10. Ensure code examples are properly formatted.
```

## Events

```javascript
// Listen to AI assistant events
editor.on('ai:generated', (content) => {
  console.log('Content generated:', content);
});

editor.on('ai:error', (error) => {
  console.error('AI generation error:', error);
});

editor.on('ai:settings-changed', (settings) => {
  console.log('Settings updated:', settings);
});
```

## Examples

### Basic Content Generation

```javascript
// Generate a simple article
const prompt = 'Write a short article about JavaScript frameworks';
const result = await aiPlugin.generateContent({
  prompt,
  driver: 'openai',
  apiKey: 'your-api-key'
});
```

### Code Generation

```javascript
// Generate code examples
const prompt = 'Create a React component for a todo list';
const result = await aiPlugin.generateContent({
  prompt,
  driver: 'deepseek',
  apiKey: 'your-api-key',
  options: {
    model: 'deepseek-coder',
    temperature: 0.3
  }
});
```

### Technical Documentation

```javascript
// Generate technical documentation
const prompt = 'Write documentation for a REST API';
const result = await aiPlugin.generateContent({
  prompt,
  driver: 'openai',
  apiKey: 'your-api-key',
  options: {
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 2000
  }
});
```

## Settings Persistence

The plugin automatically saves settings to localStorage:

```javascript
// Settings are saved under the key 'aiAssistantSettings'
const settings = {
  apiKey: 'your-api-key',
  driverName: 'openai',
  structurePrompt: '...',
  prompt: '...',
  driverOptions: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  }
};
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, AIAssistantPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new AIAssistantPlugin());
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
import { HTMLEditor, AIAssistantPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new AIAssistantPlugin());
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Custom Drivers

You can create custom AI drivers by implementing the `AIDriver` interface:

```typescript
import { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

export class CustomAIDriver implements AIDriver<DriverOptions> {
  constructor(private apiKey: string) {}

  async generateText(prompt: string, options?: DriverOptions): Promise<string> {
    // Implement your custom AI generation logic
    const response = await fetch('your-ai-endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      })
    });

    const data = await response.json();
    return data.text;
  }

  getOptionsDescription(): OptionsDescription {
    return {
      model: {
        type: 'list',
        label: 'Model',
        options: ['custom-model-1', 'custom-model-2'],
        default: 'custom-model-1'
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 2
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        default: 1000,
        min: 1,
        max: 4000
      }
    };
  }
}
```

## Troubleshooting

### Common Issues

1. **API Key not working**
   - Verify the API key is correct
   - Check if the API key has sufficient credits
   - Ensure the API key has the required permissions

2. **Content not generating**
   - Check network connectivity
   - Verify API endpoint is accessible
   - Check browser console for errors

3. **Wrong model selected**
   - Ensure the model name is correct for the selected driver
   - Check if the model is available in your API plan

4. **Settings not saving**
   - Check if localStorage is available
   - Verify browser permissions
   - Check for conflicting storage keys

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('AI Assistant plugin initialized');

// Check API responses
editor.on('ai:error', (error) => {
  console.error('AI Error:', error);
});
```

## Security Considerations

- API keys are stored in localStorage (consider encryption for production)
- No server-side processing required
- CORS policies apply to API requests
- Consider rate limiting for API calls

## Performance Considerations

- API calls are asynchronous
- Content is generated on-demand
- Settings are cached locally
- Consider implementing request caching

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
