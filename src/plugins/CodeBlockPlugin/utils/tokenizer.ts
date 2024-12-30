import { type Token, TokenType, type LanguageDefinition } from '../types';

export function tokenize(code: string, language: LanguageDefinition): Token[] {
  const tokens: Token[] = [];
  let remaining = code;

  while (remaining.length > 0) {
    const token = findNextToken(remaining, language);
    tokens.push(token);
    remaining = remaining.slice(token.value.length);
  }

  return tokens;
}

function findNextToken(code: string, language: LanguageDefinition): Token {
  // Check for whitespace first
  const whitespace = code.match(/^\s+/);
  if (whitespace) {
    return { type: TokenType.Text, value: whitespace[0] };
  }

  // Check for comments
  if (language.patterns[TokenType.Comment]) {
    const comment = code.match(language.patterns[TokenType.Comment]);
    if (comment) {
      return { type: TokenType.Comment, value: comment[0] };
    }
  }

  // Check for strings
  if (language.patterns[TokenType.String]) {
    const string = code.match(language.patterns[TokenType.String]);
    if (string) {
      return { type: TokenType.String, value: string[0] };
    }
  }

  // Check for numbers
  if (language.patterns[TokenType.Number]) {
    const number = code.match(language.patterns[TokenType.Number]);
    if (number) {
      return { type: TokenType.Number, value: number[0] };
    }
  }

  // Check for keywords
  if (language.keywords) {
    const word = code.match(/^[a-zA-Z_]\w*/);
    if (word && language.keywords.includes(word[0])) {
      return { type: TokenType.Keyword, value: word[0] };
    }
  }

  // Check for functions
  if (language.patterns[TokenType.Function]) {
    const func = code.match(language.patterns[TokenType.Function]);
    if (func) {
      return { type: TokenType.Function, value: func[0] };
    }
  }

  // Check for operators
  if (language.patterns[TokenType.Operator]) {
    const operator = code.match(language.patterns[TokenType.Operator]);
    if (operator) {
      return { type: TokenType.Operator, value: operator[0] };
    }
  }

  // Default to single character as text
  return { type: TokenType.Text, value: code[0] };
}
