import type { MathAtomKind, MathNode, ParseResult } from '../types';
import { FUNCS, GREEK, LARGE_OPS, SPACES, SYMBOLS } from '../constants/symbols';
import { tokenize } from './tokenize';
import type { Token } from './tokenize';

class Parser {
  private readonly tokens: Token[];
  private i = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): MathNode {
    const row = this.parseRow('rbrace');
    return row.children.length === 1 ? row.children[0] : row;
  }

  private peek(): Token | undefined {
    return this.tokens[this.i];
  }

  private next(): Token | undefined {
    return this.tokens[this.i++];
  }

  private expect(kind: Token['kind']): void {
    const t = this.next();
    if (!t || t.kind !== kind) {
      throw new Error(`Expected ${kind}`);
    }
  }

  /** Parse until stopper brace/bracket/\right or end. */
  private parseRow(stop?: 'rbrace' | 'rbrack' | 'right'): { type: 'row'; children: MathNode[] } {
    const children: MathNode[] = [];
    while (this.i < this.tokens.length) {
      const t = this.peek();
      if (!t) {
        break;
      }
      if (stop === 'right' && t.kind === 'command' && t.name === 'right') {
        break;
      }
      if (stop && t.kind === stop) {
        break;
      }
      if (t.kind === 'rbrace' || t.kind === 'rbrack') {
        break;
      }
      if (t.kind === 'space') {
        this.next();
        continue;
      }
      children.push(this.parseNucleus());
    }
    return { type: 'row', children };
  }

  private parseGroup(): MathNode {
    this.expect('lbrace');
    const row = this.parseRow('rbrace');
    this.expect('rbrace');
    return row.children.length === 1 ? row.children[0] : row;
  }

  private parseOptionalBracket(): MathNode | undefined {
    if (this.peek()?.kind !== 'lbrack') {
      return undefined;
    }
    this.next();
    const row = this.parseRow('rbrack');
    this.expect('rbrack');
    return row.children.length === 1 ? row.children[0] : row;
  }

  private parseScriptBody(): MathNode {
    const t = this.peek();
    if (t?.kind === 'lbrace') {
      return this.parseGroup();
    }
    return this.parseSingleAtom();
  }

  private parseSingleAtom(): MathNode {
    const t = this.next();
    if (!t) {
      throw new Error('Unexpected end');
    }
    if (t.kind === 'char') {
      return atomFromChar(t.value);
    }
    if (t.kind === 'command') {
      return this.commandAsAtom(t.name);
    }
    throw new Error(`Expected atom, got ${t.kind}`);
  }

  private commandAsAtom(name: string): MathNode {
    if (GREEK[name]) {
      return { type: 'atom', kind: 'ord', text: GREEK[name] };
    }
    if (SYMBOLS[name]) {
      const text = SYMBOLS[name];
      const kind: MathAtomKind =
        name === 'pm' || name === 'times' || name === 'div' || name === 'cdot' || name === 'mp'
          ? 'bin'
          : name === 'leq' ||
              name === 'geq' ||
              name === 'neq' ||
              name === 'approx' ||
              name === 'equiv' ||
              name === 'in' ||
              name === 'to' ||
              name === 'rightarrow' ||
              name === 'leftarrow'
            ? 'rel'
            : 'ord';
      return { type: 'atom', kind, text };
    }
    if (FUNCS.has(name)) {
      return { type: 'func', name };
    }
    if (SPACES[name]) {
      return { type: 'space', width: SPACES[name] };
    }
    // Unknown command → show as text
    return { type: 'atom', kind: 'ord', text: `\\${name}` };
  }

  private parseNucleus(): MathNode {
    const base = this.parsePrimary();
    // Attach scripts: _ ^ in any order, at most one each
    let sub: MathNode | undefined;
    let exp: MathNode | undefined;
    for (;;) {
      const t = this.peek();
      if (t?.kind === 'sub' && !sub) {
        this.next();
        sub = this.parseScriptBody();
        continue;
      }
      if (t?.kind === 'sup' && !exp) {
        this.next();
        exp = this.parseScriptBody();
        continue;
      }
      break;
    }
    if (sub && exp) {
      if (base.type === 'largeOp') {
        return { ...base, sub, exp };
      }
      return { type: 'subsup', base, sub, exp };
    }
    if (sub) {
      if (base.type === 'largeOp') {
        return { ...base, sub };
      }
      return { type: 'sub', base, sub };
    }
    if (exp) {
      if (base.type === 'largeOp') {
        return { ...base, exp };
      }
      return { type: 'sup', base, exp };
    }
    return base;
  }

  private parsePrimary(): MathNode {
    const t = this.peek();
    if (!t) {
      throw new Error('Unexpected end of expression');
    }

    if (t.kind === 'lbrace') {
      return this.parseGroup();
    }

    if (t.kind === 'char') {
      this.next();
      return atomFromChar(t.value);
    }

    if (t.kind === 'command') {
      this.next();
      return this.parseCommand(t.name);
    }

    throw new Error(`Unexpected token ${t.kind}`);
  }

  private parseCommand(name: string): MathNode {
    if (name === 'frac') {
      const num = this.parseGroup();
      const den = this.parseGroup();
      return { type: 'frac', num, den };
    }
    if (name === 'sqrt') {
      const index = this.parseOptionalBracket();
      const body = this.parseGroup();
      return index ? { type: 'sqrt', body, index } : { type: 'sqrt', body };
    }
    if (name === 'left') {
      const leftTok = this.next();
      const left = delimiterFromToken(leftTok);
      const body = this.parseRow('right');
      // expect \right
      const rightCmd = this.next();
      if (rightCmd?.kind !== 'command' || rightCmd.name !== 'right') {
        throw new Error(String.raw`Expected \right`);
      }
      const rightTok = this.next();
      const right = delimiterFromToken(rightTok);
      const inner = body.children.length === 1 ? body.children[0] : body;
      return { type: 'leftRight', left, body: inner, right };
    }
    if (LARGE_OPS.has(name)) {
      const op = name === 'sum' ? '∑' : name === 'int' ? '∫' : name === 'prod' ? '∏' : 'lim';
      return { type: 'largeOp', op: name === 'lim' ? 'lim' : op };
    }
    return this.commandAsAtom(name);
  }
}

function delimiterFromToken(t: Token | undefined): string {
  if (!t) {
    return '.';
  }
  if (t.kind === 'char') {
    return t.value === '.' ? '' : t.value;
  }
  if (t.kind === 'command') {
    if (t.name === 'lvert' || t.name === '|') {
      return '|';
    }
    if (t.name === '(' || t.name === ')') {
      return t.name;
    }
    if (t.name === '{' || t.name === 'lbrace') {
      return '{';
    }
    if (t.name === '}' || t.name === 'rbrace') {
      return '}';
    }
    return t.name;
  }
  if (t.kind === 'lbrack') {
    return '[';
  }
  if (t.kind === 'rbrack') {
    return ']';
  }
  return '.';
}

function atomFromChar(ch: string): MathNode {
  if (/[0-9.]/.test(ch)) {
    return { type: 'atom', kind: 'ord', text: ch };
  }
  if (/[a-zA-Z]/.test(ch)) {
    return { type: 'atom', kind: 'ord', text: ch };
  }
  if ('+-*/'.includes(ch)) {
    return { type: 'atom', kind: 'bin', text: ch === '*' ? '∗' : ch };
  }
  if ('=<>'.includes(ch)) {
    return { type: 'atom', kind: 'rel', text: ch };
  }
  if ('([{'.includes(ch)) {
    return { type: 'atom', kind: 'open', text: ch };
  }
  if (')]}'.includes(ch)) {
    return { type: 'atom', kind: 'close', text: ch };
  }
  if (',;:!|'.includes(ch)) {
    return { type: 'atom', kind: 'punct', text: ch };
  }
  return { type: 'atom', kind: 'ord', text: ch };
}

/** Parse TeX-subset expression into AST. */
export function parseMath(expression: string): ParseResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { ok: false, error: 'Empty expression', expression };
  }
  try {
    const tokens = tokenize(trimmed);
    const ast = new Parser(tokens).parse();
    return { ok: true, ast };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Parse error',
      expression,
    };
  }
}
