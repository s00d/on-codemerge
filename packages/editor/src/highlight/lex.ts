import rulesJson from './universalRules.json';
import {
  HIGHLIGHT_MAX_CHARS,
  HIGHLIGHT_MAX_STEPS,
  HIGHLIGHT_MAX_TOKENS,
  TOKEN_TYPE_ALLOWLIST,
} from './types';
import type { HighlightToken, TokenType, UniversalRule } from './types';

const ALLOWLIST = new Set<string>(TOKEN_TYPE_ALLOWLIST);

type CompiledRule = {
  type: TokenType;
  regex: RegExp;
};

function isTokenType(type: string): type is TokenType {
  return ALLOWLIST.has(type);
}

function compileRules(rules: UniversalRule[]): CompiledRule[] {
  const out: CompiledRule[] = [];
  for (const rule of rules) {
    if (!isTokenType(rule.type)) {
      continue;
    }
    try {
      out.push({
        type: rule.type,
        regex: new RegExp(rule.match),
      });
    } catch {
      // Invalid pattern in config — skip (fail closed for that rule).
    }
  }
  return out;
}

const COMPILED = compileRules(rulesJson.rules);

/**
 * Language-agnostic structural lexer.
 * Sticky longest-match over universal rules; whitespace / unknowns → plain text.
 */
export function lex(code: string): HighlightToken[] {
  if (code.length > HIGHLIGHT_MAX_CHARS) {
    return [{ type: 'text', value: code.slice(0, HIGHLIGHT_MAX_CHARS) }];
  }

  const tokens: HighlightToken[] = [];
  let remaining = code;
  let steps = 0;

  while (remaining) {
    steps += 1;
    if (steps > HIGHLIGHT_MAX_STEPS) {
      tokens.push({ type: 'text', value: remaining });
      break;
    }

    const whitespace = /^\s+/.exec(remaining);
    if (whitespace) {
      tokens.push({ type: 'text', value: whitespace[0] });
      remaining = remaining.slice(whitespace[0].length);
      continue;
    }

    let best: { length: number; type: TokenType; value: string } | null = null;
    for (const rule of COMPILED) {
      rule.regex.lastIndex = 0;
      const result = rule.regex.exec(remaining);
      if (!result || result.index !== 0) {
        continue;
      }
      const value = result[0];
      if (!value) {
        continue;
      }
      if (!best || value.length > best.length) {
        best = { length: value.length, type: rule.type, value };
      }
    }

    if (best) {
      tokens.push({ type: best.type, value: best.value });
      remaining = remaining.slice(best.length);
      if (tokens.length > HIGHLIGHT_MAX_TOKENS) {
        return tokens;
      }
      continue;
    }

    tokens.push({ type: 'text', value: remaining[0] ?? '' });
    remaining = remaining.slice(1);
    if (tokens.length > HIGHLIGHT_MAX_TOKENS) {
      return tokens;
    }
  }

  return tokens;
}
