import { type LanguageDefinition, TokenType } from '../../../types';

export const goDefinition: LanguageDefinition = {
  name: 'go',
  patterns: {
    [TokenType.Comment]: /^\/\/.*$|^\/\*[\s\S]*?\*\//,
    [TokenType.String]: /^(?:"(?:\\.|[^"\\])*"|`[^`]*`)/,
    [TokenType.Number]: /^\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?i?\b/,
    [TokenType.Function]: /^\b[a-zA-Z_]\w*(?=\s*\()/,
    [TokenType.Type]:
      /^\b(?:string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|complex64|complex128|byte|rune|bool|error|interface)\b/,
    [TokenType.Operator]: /^(?:->|:=|\+\+|--|\|\||&&|[+\-*/%&|^<>!=]=?)/,
    [TokenType.Punctuation]: /^[{}[\]();,.]/,
  },
  keywords: [
    'break',
    'case',
    'chan',
    'const',
    'continue',
    'default',
    'defer',
    'else',
    'fallthrough',
    'for',
    'func',
    'go',
    'goto',
    'if',
    'import',
    'interface',
    'map',
    'package',
    'range',
    'return',
    'select',
    'struct',
    'switch',
    'type',
    'var',
  ],
};
