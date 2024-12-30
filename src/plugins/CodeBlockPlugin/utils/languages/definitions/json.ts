import { type LanguageDefinition, TokenType } from '../../../types';

export const jsonDefinition: LanguageDefinition = {
  name: 'json',
  patterns: {
    [TokenType.String]: /^"(?:\\.|[^"\\])*"/,
    [TokenType.Number]: /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/,
    [TokenType.Punctuation]: /^[{}\[\],:]/,
    [TokenType.Boolean]: /^(?:true|false)\b/,
    [TokenType.Null]: /^null\b/,
  },
  keywords: [],
};
