import { type LanguageDefinition, TokenType } from '../../../types';

export const cssDefinition: LanguageDefinition = {
  name: 'css',
  patterns: {
    [TokenType.Comment]: /^\/\*[\s\S]*?\*\//,
    [TokenType.Selector]: /^[.#]?[\w-]+(?:\[[^\]]+\]|\:{1,2}[\w-]+)*(?=\s*\{)/,
    [TokenType.Property]: /^[-\w]+(?=\s*:)/,
    [TokenType.Value]: /^:[^;]+/,
    [TokenType.String]: /^(['"])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    [TokenType.Unit]: /^\b\d+(?:px|em|rem|%|vh|vw|deg|s|ms)?\b/,
    [TokenType.Color]: /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/,
    [TokenType.Punctuation]: /^[{};:]/,
  },
  keywords: [
    'important',
    '@media',
    '@keyframes',
    '@import',
    '@charset',
    '@supports',
    '@page',
    '@namespace',
    '@font-face',
  ],
};
