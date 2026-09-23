export type Token =
  | { kind: 'char'; value: string }
  | { kind: 'command'; name: string }
  | { kind: 'sup' }
  | { kind: 'sub' }
  | { kind: 'lbrace' }
  | { kind: 'rbrace' }
  | { kind: 'lbrack' }
  | { kind: 'rbrack' }
  | { kind: 'space' };

const COMMAND_RE = /^[A-Za-z]+/;

/** TeX-subset tokenizer. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input;

  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch)) {
      tokens.push({ kind: 'space' });
      while (i < s.length && /\s/.test(s[i])) {
        i += 1;
      }
      continue;
    }

    if (ch === '\\') {
      i += 1;
      if (i >= s.length) {
        break;
      }
      const next = s[i];
      if (COMMAND_RE.test(next)) {
        const m = COMMAND_RE.exec(s.slice(i));
        const name = m?.[0] ?? next;
        tokens.push({ kind: 'command', name });
        i += name.length;
      } else {
        // Single-char commands: \, \; \{ \} etc.
        tokens.push({ kind: 'command', name: next });
        i += 1;
      }
      continue;
    }

    if (ch === '^') {
      tokens.push({ kind: 'sup' });
      i += 1;
      continue;
    }
    if (ch === '_') {
      tokens.push({ kind: 'sub' });
      i += 1;
      continue;
    }
    if (ch === '{') {
      tokens.push({ kind: 'lbrace' });
      i += 1;
      continue;
    }
    if (ch === '}') {
      tokens.push({ kind: 'rbrace' });
      i += 1;
      continue;
    }
    if (ch === '[') {
      tokens.push({ kind: 'lbrack' });
      i += 1;
      continue;
    }
    if (ch === ']') {
      tokens.push({ kind: 'rbrack' });
      i += 1;
      continue;
    }

    tokens.push({ kind: 'char', value: ch });
    i += 1;
  }

  return tokens;
}
