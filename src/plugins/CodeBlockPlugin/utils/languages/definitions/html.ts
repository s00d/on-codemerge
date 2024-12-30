import { type LanguageDefinition, TokenType } from '../../../types';

export const htmlDefinition: LanguageDefinition = {
  name: 'html',
  patterns: {
    [TokenType.Comment]: /^<!--[\s\S]*?-->/,
    [TokenType.Tag]: /^<\/?[^\s>]+/,
    [TokenType.Attribute]: /^\s+[a-zA-Z_:][a-zA-Z0-9_:.-]*(?=\s*=)/,
    [TokenType.String]: /^=\s*(['"])(.*?)\1/,
    [TokenType.Punctuation]: /^[<>\/=]/,
  },
  keywords: [],
};
