# AI Assistant Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
