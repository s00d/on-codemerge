import { type LanguageDefinition, TokenType } from '../../../types';

export const swiftDefinition: LanguageDefinition = {
  name: 'swift',
  patterns: {
    [TokenType.Comment]: /^\/\/.*$|^\/\*[\s\S]*?\*\//,
    [TokenType.String]: /^"(?:[^"\\]|\\.)*"/,
    [TokenType.Number]: /^\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/,
    [TokenType.Function]: /^\b[a-zA-Z_]\w*(?=\s*\()/,
    [TokenType.Type]: /^\b(?:Int|Double|Float|String|Bool|Character|Any|AnyObject)\b/,
    [TokenType.Decorator]: /^@\w+/,
    [TokenType.Operator]: /^(?:->|===|!==|\?\?|\+\+|--|&&|\|\||[+\-*/%&|^<>!=]=?)/,
    [TokenType.Punctuation]: /^[{}[\]();,.]/,
  },
  keywords: [
    'as',
    'break',
    'case',
    'catch',
    'class',
    'continue',
    'default',
    'defer',
    'do',
    'else',
    'enum',
    'extension',
    'fallthrough',
    'false',
    'fileprivate',
    'final',
    'for',
    'func',
    'guard',
    'if',
    'import',
    'in',
    'init',
    'inout',
    'internal',
    'is',
    'let',
    'nil',
    'open',
    'operator',
    'private',
    'protocol',
    'public',
    'repeat',
    'rethrows',
    'return',
    'self',
    'static',
    'struct',
    'super',
    'switch',
    'throw',
    'throws',
    'true',
    'try',
    'typealias',
    'var',
    'where',
    'while',
  ],
};