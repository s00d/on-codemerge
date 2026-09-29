/** Allowlisted structural token kinds — unknown types paint as plain text. */
export const TOKEN_TYPE_ALLOWLIST = [
  'comment',
  'string',
  'number',
  'boolean',
  'operator',
  'punctuation',
  'ident',
] as const;

export type TokenType = (typeof TOKEN_TYPE_ALLOWLIST)[number];

export type HighlightToken = {
  type: TokenType | 'text';
  value: string;
};

export type UniversalRule = {
  type: string;
  match: string;
};

export type UniversalRules = {
  rules: UniversalRule[];
};

/** Soft caps against pathological input / ReDoS / DOM bombs. */
export const HIGHLIGHT_MAX_CHARS = 200_000;
export const HIGHLIGHT_MAX_STEPS = 400_000;
/** Max lex tokens before highlightHtml falls back to plain escaped text. */
export const HIGHLIGHT_MAX_TOKENS = 8_000;
