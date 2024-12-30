import { type LanguageDefinition, TokenType } from '../../../types';

export const yamlDefinition: LanguageDefinition = {
  name: 'yaml',
  patterns: {
    [TokenType.Comment]: /^#.*/,
    [TokenType.String]: /^(?:'(?:''|[^'])*'|"(?:\\.|[^"\\])*")/,
    [TokenType.Number]: /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/,
    [TokenType.Key]: /^[\w-]+(?=\s*:)/,
    [TokenType.Operator]: /^[:|>-]/,
    [TokenType.Punctuation]: /^[-?:,[\]{}]/,
    [TokenType.Variable]: /^\${[\w.-]+}/,
    [TokenType.Boolean]: /^(?:true|false|yes|no|on|off)\b/i,
  },
  keywords: ['true', 'false', 'null', 'yes', 'no', 'on', 'off'],
};
