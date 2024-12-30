export enum TokenType {
  // Base types
  Text = 'text',
  Keyword = 'keyword',
  String = 'string',
  Number = 'number',
  Key = 'key',
  Comment = 'comment',
  Operator = 'operator',
  Function = 'function',
  Atom = 'atom',
  Variable = 'variable',
  Type = 'type',
  Interface = 'interface',
  Punctuation = 'punctuation',

  // HTML/XML
  Tag = 'tag',
  Attribute = 'attribute',

  // CSS
  Selector = 'selector',
  Property = 'property',
  Value = 'value',
  Unit = 'unit',
  Color = 'color',

  // Special types
  Decorator = 'decorator',
  Symbol = 'symbol',
  Command = 'command',
  Parameter = 'parameter',
  Lifetime = 'lifetime',

  // Markdown
  Heading = 'heading',
  Bold = 'bold',
  Italic = 'italic',
  Link = 'link',
  Code = 'code',
  List = 'list',
  Blockquote = 'blockquote',
  HorizontalRule = 'hr',

  // JSON
  Boolean = 'boolean',
  Null = 'null',
}

export interface Token {
  type: TokenType;
  value: string;
}

export interface LanguageDefinition {
  name: string;
  patterns: {
    [key in TokenType]?: RegExp;
  };
  keywords: string[];
}
