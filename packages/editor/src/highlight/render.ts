import { lex } from './lex';
import { HIGHLIGHT_MAX_CHARS, HIGHLIGHT_MAX_TOKENS, TOKEN_TYPE_ALLOWLIST } from './types';
import type { HighlightToken } from './types';

const ALLOWLIST = new Set<string>(TOKEN_TYPE_ALLOWLIST);

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function tokensToHtml(tokens: HighlightToken[]): string {
  return tokens
    .map((token) => {
      if (token.type === 'text' || !ALLOWLIST.has(token.type)) {
        return escapeHtml(token.value);
      }
      return `<span class="token ${token.type}">${escapeHtml(token.value)}</span>`;
    })
    .join('');
}

/**
 * Universal structural highlight → escaped HTML spans.
 * Oversized input (chars or token count) paints as escaped plain text.
 */
export function highlightHtml(code: string): string {
  if (code.length > HIGHLIGHT_MAX_CHARS) {
    return escapeHtml(code);
  }
  const tokens = lex(code);
  if (tokens.length > HIGHLIGHT_MAX_TOKENS) {
    return escapeHtml(code);
  }
  return tokensToHtml(tokens);
}
