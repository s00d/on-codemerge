import { type LanguageDefinition, TokenType } from '../../../types';

export const markdownDefinition: LanguageDefinition = {
  name: 'markdown',
  patterns: {
    [TokenType.Heading]: /^#{1,6}\s+[^\n]+/m,
    [TokenType.Bold]: /^\*\*[^*]+\*\*|\b__[^_]+__\b/,
    [TokenType.Italic]: /^\*[^*]+\*|\b_[^_]+_\b/,
    [TokenType.Link]: /^\[([^\]]+)\]\(([^)]+)\)/,
    [TokenType.Code]: /^`[^`]+`|^```[\s\S]+?```/m,
    [TokenType.List]: /^(?:[*+-]|\d+\.)\s+/m,
    [TokenType.Blockquote]: /^>\s+[^\n]+/m,
    [TokenType.HorizontalRule]: /^(?:-{3,}|\*{3,}|_{3,})$/m,
  },
  keywords: [],
};
