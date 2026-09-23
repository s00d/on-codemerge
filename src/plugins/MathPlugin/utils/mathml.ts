import type { MathNode } from '../types';

const NS = 'http://www.w3.org/1998/Math/MathML';

function el(
  tag: string,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): Element {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') {
      node.append(document.createTextNode(child));
    } else {
      node.append(child);
    }
  }
  return node;
}

function mi(text: string, italic = true): Element {
  return el('mi', italic ? {} : { mathvariant: 'normal' }, text);
}

function mn(text: string): Element {
  return el('mn', {}, text);
}

function mo(text: string, attrs: Record<string, string> = {}): Element {
  return el('mo', attrs, text);
}

function emit(node: MathNode): Node {
  switch (node.type) {
    case 'row': {
      return el('mrow', {}, ...node.children.map(emit));
    }
    case 'atom': {
      const { kind, text } = node;
      if (kind === 'ord') {
        if (/^[0-9.]+$/.test(text)) {
          return mn(text);
        }
        if (/^[a-zA-Z]$/.test(text)) {
          return mi(text);
        }
        // greek / unicode letters
        if (text.length === 1 && /[α-ωΑ-Ω∞∂∇]/.test(text)) {
          return mi(text);
        }
        return mi(text, false);
      }
      if (kind === 'bin' || kind === 'rel' || kind === 'punct') {
        return mo(text);
      }
      if (kind === 'open' || kind === 'close') {
        return mo(text);
      }
      return mo(text);
    }
    case 'space': {
      const w =
        node.width === 'thin'
          ? '0.1667em'
          : node.width === 'med'
            ? '0.2222em'
            : node.width === 'thick'
              ? '0.2777em'
              : '1em';
      return el('mspace', { width: w });
    }
    case 'frac': {
      return el('mfrac', {}, emit(node.num), emit(node.den));
    }
    case 'sqrt': {
      return node.index
        ? el('mroot', {}, emit(node.body), emit(node.index))
        : el('msqrt', {}, emit(node.body));
    }
    case 'sup': {
      return el('msup', {}, emit(node.base), emit(node.exp));
    }
    case 'sub': {
      return el('msub', {}, emit(node.base), emit(node.sub));
    }
    case 'subsup': {
      return el('msubsup', {}, emit(node.base), emit(node.sub), emit(node.exp));
    }
    case 'largeOp': {
      const op = mo(node.op, { largeop: 'true', movablelimits: 'true' });
      if (node.sub && node.exp) {
        return el('munderover', {}, op, emit(node.sub), emit(node.exp));
      }
      if (node.sub) {
        return el('munder', {}, op, emit(node.sub));
      }
      if (node.exp) {
        return el('mover', {}, op, emit(node.exp));
      }
      return op;
    }
    case 'func': {
      return mi(node.name, false);
    }
    case 'leftRight': {
      return el(
        'mrow',
        {},
        mo(node.left || '', { fence: 'true', stretchy: 'true' }),
        emit(node.body),
        mo(node.right || '', { fence: 'true', stretchy: 'true' })
      );
    }
    default: {
      const _exhaustive: never = node;
      return el('mrow', {}, String(_exhaustive));
    }
  }
}

/** AST → MathML `<math display="block">` element. */
export function astToMathML(ast: MathNode, display: 'block' | 'inline' = 'block'): Element {
  return el('math', { display, xmlns: NS }, emit(ast));
}

/** Escape text for error fallback. */
export function escapeText(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
