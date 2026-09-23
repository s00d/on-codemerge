/** Math expression string (TeX subset). */
export type MathExpression = string;

export type MathSpace = 'thin' | 'med' | 'thick' | 'quad';

export type MathAtomKind = 'ord' | 'op' | 'bin' | 'rel' | 'open' | 'close' | 'punct';

export type MathNode =
  | { type: 'row'; children: MathNode[] }
  | { type: 'atom'; kind: MathAtomKind; text: string }
  | { type: 'space'; width: MathSpace }
  | { type: 'frac'; num: MathNode; den: MathNode }
  | { type: 'sqrt'; body: MathNode; index?: MathNode }
  | { type: 'sup'; base: MathNode; exp: MathNode }
  | { type: 'sub'; base: MathNode; sub: MathNode }
  | { type: 'subsup'; base: MathNode; sub: MathNode; exp: MathNode }
  | { type: 'largeOp'; op: string; sub?: MathNode; exp?: MathNode }
  | { type: 'func'; name: string }
  | { type: 'leftRight'; left: string; body: MathNode; right: string };

export type ParseResult =
  | { ok: true; ast: MathNode }
  | { ok: false; error: string; expression: string };
