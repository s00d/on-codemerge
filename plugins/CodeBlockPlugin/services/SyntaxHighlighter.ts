import { TokenType } from '../types';
import type { LanguageDefinition, Token } from '../types';
import { getLanguageDefinition } from '../utils/languages';

export class SyntaxHighlighter {
  /** Pure highlight → HTML (DOM apply only inside `foreign(...)`). */
  public highlightHtml(code: string, language: string): string {
    const languageDefinition = getLanguageDefinition(language);
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    if (!languageDefinition) {
      return this.escapeHtml(code);
    }
    return this.renderTokens(this.tokenize(code, languageDefinition));
  }

  private tokenize(code: string, definition: LanguageDefinition): Token[] {
    const tokens: Token[] = [];
    let remaining = code;

    while (remaining) {
      // Check for whitespace first
      const whitespace = /^\s+/.exec(remaining);
      if (whitespace) {
        tokens.push({ type: TokenType.Text, value: whitespace[0] });
        remaining = remaining.slice(whitespace[0].length);
        continue;
      }

      // Check for keywords
      // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
      if (definition.keywords) {
        const word = /^\b\w+\b/.exec(remaining);
        if (word && definition.keywords.includes(word[0])) {
          tokens.push({ type: TokenType.Keyword, value: word[0] });
          remaining = remaining.slice(word[0].length);
          continue;
        }
      }

      // Check patterns
      let longestMatch: { length: number; type: TokenType | null; value: string } = {
        length: 0,
        type: null,
        value: '',
      };

      for (const tokenType of Object.values(TokenType)) {
        const pattern = definition.patterns[tokenType];
        // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
        if (!pattern) {
          continue;
        }

        const flags = `${pattern.flags.replaceAll('g', '').replaceAll('y', '')}y`;
        const regex = new RegExp(pattern.source, flags);
        regex.lastIndex = 0;
        const result = regex.exec(remaining);

        if (result && result[0].length > longestMatch.length) {
          longestMatch = {
            length: result[0].length,
            type: tokenType,
            value: result[0],
          };
        }
      }

      if (longestMatch.type !== null) {
        tokens.push({ type: longestMatch.type, value: longestMatch.value });
        remaining = remaining.slice(longestMatch.length);
      } else {
        // No match found, treat as plain text
        tokens.push({ type: TokenType.Text, value: remaining[0] });
        remaining = remaining.slice(1);
      }
    }

    return tokens;
  }

  private renderTokens(tokens: Token[]): string {
    return tokens
      .map((token) => {
        if (token.type === TokenType.Text) {
          return this.escapeHtml(token.value);
        }
        return `<span class="token ${token.type}">${this.escapeHtml(token.value)}</span>`;
      })
      .join('');
  }

  private escapeHtml(text: string): string {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
