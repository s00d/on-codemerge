# Footer Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Footer Plugin automatically adds a statistics footer to the on-CodeMerge editor, displaying real-time document statistics including word count, character count, and other metrics.

## Features

- **Real-time Statistics**: Live word and character counting
- **Automatic Updates**: Statistics update as content changes
- **Document Metrics**: Words, characters, paragraphs, sentences
- **Customizable Display**: Configurable footer appearance
- **Performance Optimized**: Efficient calculation algorithms
- **Content Monitoring**: Automatic content change detection
- **Statistics Calculator**: Advanced metrics calculation
- **Footer Renderer**: Flexible footer rendering system

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FooterPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FooterPlugin());
```

## Demo
## API Reference

### Statistics Methods

```javascript
// Get current statistics
const stats = footerPlugin.getStatistics();

// Calculate statistics for content
const stats = statisticsCalculator.calculate(htmlContent);

// Update footer display
footerRenderer.update(stats);

// Get specific metrics
const wordCount = stats.words;
const charCount = stats.characters;
const paragraphCount = stats.paragraphs;
const sentenceCount = stats.sentences;
```

### Statistics Object

```javascript
interface DocumentStatistics {
  words: number;           // Word count
  characters: number;      // Character count (with spaces)
  charactersNoSpaces: number; // Character count (without spaces)
  paragraphs: number;      // Paragraph count
  sentences: number;       // Sentence count
  lines: number;          // Line count
  readingTime: number;    // Estimated reading time (minutes)
}
```

## Events

```javascript
// Listen to statistics updates
editor.on('statistics:updated', (stats) => {
  console.log('Statistics updated:', stats);
});

editor.on('content:changed', () => {
  console.log('Content changed, updating statistics');
});
```


_…trimmed for the v1 archive. See source history for the full guide._
