import { type LanguageDefinition, type Token, TokenType } from '../types';
import { getLanguageDefinition } from '../utils/languages';

export class SyntaxHighlighter {
  public highlight(element: Element): void {
    const code = element.textContent || '';
    const language = this.getLanguage(element);
    const languageDefinition = getLanguageDefinition(language);

    if (languageDefinition) {
      const tokens = this.tokenize(code, languageDefinition);
      element.innerHTML = this.renderTokens(tokens);
    }
  }

  private getLanguage(element: Element): string {
    const className = element.className;
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : 'plaintext';
  }

  private tokenize(code: string, definition: LanguageDefinition): Token[] {
    const tokens: Token[] = [];
    let remaining = code;

    while (remaining) {
      // Check for whitespace first
      const whitespace = remaining.match(/^\s+/);
      if (whitespace) {
        tokens.push({ type: TokenType.Text, value: whitespace[0] });
        remaining = remaining.slice(whitespace[0].length);
        continue;
      }

      // Check for keywords
      if (definition.keywords) {
        const word = remaining.match(/^\b\w+\b/);
        if (word && definition.keywords.includes(word[0])) {
          tokens.push({ type: TokenType.Keyword, value: word[0] });
          remaining = remaining.slice(word[0].length);
          continue;
        }
      }

      // Check patterns
      let longestMatch = { length: 0, type: null as TokenType | null, value: '' };

      for (const [tokenType, pattern] of Object.entries(definition.patterns)) {
        if (!pattern) continue;

        const regex = new RegExp(pattern.source, 'y');
        regex.lastIndex = 0;
        const result = regex.exec(remaining);

        if (result && result[0].length > longestMatch.length) {
          longestMatch = {
            length: result[0].length,
            type: tokenType as TokenType,
            value: result[0],
          };
        }
      }

      if (longestMatch.type) {
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
