import type { FormattingOptions } from '../types';

export class HTMLFormatter {
  private defaultOptions: FormattingOptions = {
    indentSize: 2,
    maxLineLength: 80,
  };

  constructor(private options: Partial<FormattingOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  public format(html: string): string {
    let formatted = '';
    let indent = 0;
    const { indentSize } = { ...this.defaultOptions, ...this.options };

    // Split by tags but preserve attributes with > or < symbols
    const parts = html.split(/(<[^>]+>)/g).filter(Boolean);

    parts.forEach((part) => {
      if (!part.trim()) return;

      // Handle closing tags
      if (part.match(/^<\//)) {
        indent = Math.max(0, indent - 1);
      }

      // Add formatted element with proper indentation
      if (part.startsWith('<')) {
        formatted += '\n' + ' '.repeat(indent * indentSize) + part;
      } else {
        formatted += part;
      }

      // Increase indent for opening tags that aren't self-closing or void elements
      if (part.match(/^<[^/][^>]*[^/]>$/) && !this.isVoidElement(part)) {
        indent = Math.max(0, indent + 1);
      }
    });

    return formatted.trim();
  }

  private isVoidElement(tag: string): boolean {
    const match = tag.match(/<([a-zA-Z0-9-]+)/);
    if (!match) return false;

    const voidElements = [
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ];
    return voidElements.includes(match[1].toLowerCase());
  }
}
