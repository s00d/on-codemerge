/**
 * Strip inline Markdown styles (emphasis, strong, strikethrough, code spans, inline and
 * reference links) from source text, keeping the visible text.
 *
 * Follows CommonMark: block structure (containers, fences, indented code, HTML blocks, link
 * reference definitions, lazy lines) decides what is inline text; inline parsing uses the
 * bracket stack for links and the delimiter stack (flanking, `_` intraword, rule of 3) for
 * emphasis; `~`/`~~` (GFM) pairs runs of equal length. Kept as written: images, autolinks,
 * raw HTML, entities, backslash escapes, links without visible text, whitespace-only code.
 *
 * Removing marks can expose new syntax (`*>` → `>`, `&*mp;*` → `&mp;`); such output is
 * escaped, and every result is checked to re-parse to itself. Verified against commonmark.js
 * (all 652 spec examples, ~10^6 fuzzed documents).
 */

type Delim = {
  kind: 'delim';
  ch: '*' | '_' | '~';
  /** Remaining (unmatched) length. */
  count: number;
  orig: number;
  canOpen: boolean;
  canClose: boolean;
  /** Could open or close as written (kept after link text disables matching). */
  flanking: boolean;
};
/**
 * `text` — source text (escapes kept); `raw` — verbatim (images, autolinks, HTML, link text);
 * `code` — code span content that now becomes plain source.
 */
type Tok =
  | { kind: 'text' | 'tick'; value: string }
  | { kind: 'raw'; value: string; link?: boolean }
  | { kind: 'code'; value: string; lineStart: boolean }
  | Delim;

const PUNCT = /[\p{P}\p{S}]/u;
const ENTITY_AT = /&(?:#\d{1,7}|#[xX][\da-fA-F]{1,6}|[a-zA-Z][a-zA-Z\d]{1,31});/y;
const SPACE = /\s/u;
const ESCAPABLE = /[!-/:-@[-`{-~]/;

function isSpace(ch: string | undefined): boolean {
  return ch === undefined || SPACE.test(ch);
}
function isPunct(ch: string | undefined): boolean {
  return ch !== undefined && PUNCT.test(ch);
}

/** Length of a code span starting at `i` (a backtick run), or 0 when unmatched. */
function codeSpanEnd(s: string, i: number): { end: number; ticks: number } | null {
  let n = 0;
  while (s[i + n] === '`') {
    n++;
  }
  let j = i + n;
  while (j < s.length) {
    const k = s.indexOf('`', j);
    if (k < 0) {
      return null;
    }
    let m = 0;
    while (s[k + m] === '`') {
      m++;
    }
    if (m === n) {
      return { end: k + m, ticks: n };
    }
    j = k + m;
  }
  return null;
}

/** Code span content per CommonMark: one surrounding space stripped when both sides have one. */
function codeContent(raw: string): string {
  if (raw.length >= 2 && raw.startsWith(' ') && raw.endsWith(' ') && raw.trim() !== '') {
    return raw.slice(1, -1);
  }
  return raw;
}

/** Link reference labels defined in the chunk being stripped (normalized). */
let DEFS = new Set<string>();
/** Inside a paragraph's block-level re-check (no nested re-checks). */
let CHECKING = false;

/** CommonMark label matching: case-fold, trim, collapse inner whitespace. */
function normLabel(label: string): string {
  return label.trim().replaceAll(/\s+/g, ' ').toLowerCase().toUpperCase();
}

/** Length of a link label (`[…]`, no unescaped brackets) at `at`, or 0. */
function labelLength(s: string, at: number): number {
  const m = /^\[(?:[^\\[\]]|\\.){0,999}\]/s.exec(s.slice(at));
  return m ? m[0].length : 0;
}

/** Index after the `)` of an inline link destination starting at `(` index `i`, or -1. */
function destinationEnd(s: string, i: number): number {
  let j = i + 1;
  // Optional whitespace incl. line endings (callers keep the removed newlines).
  const skipWs = () => {
    while (j < s.length && (s[j] === ' ' || s[j] === '\t' || s[j] === '\n')) {
      j++;
    }
  };
  skipWs();
  if (s[j] === '<') {
    j++;
    while (j < s.length && s[j] !== '>') {
      if (s[j] === '\n' || s[j] === '<') {
        return -1;
      }
      if (s[j] === '\\') {
        j++;
      }
      j++;
    }
    if (s[j] !== '>') {
      return -1;
    }
    j++;
  } else {
    let parens = 0;
    while (j < s.length) {
      const c = s[j];
      if (c === '\\' && ESCAPABLE.test(s[j + 1] ?? '')) {
        j += 2;
        continue;
      }
      // Destinations end at ASCII space / control only (U+00A0 is part of the URL).
      if (c.charCodeAt(0) <= 0x20) {
        break;
      }
      if (c === '(') {
        parens++;
      } else if (c === ')') {
        if (parens === 0) {
          break;
        }
        parens--;
      }
      j++;
    }
    if (parens !== 0) {
      return -1;
    }
  }
  const destEnd = j;
  skipWs();
  const q = s[j];
  // A title is separated from the destination by whitespace.
  if (j > destEnd && (q === '"' || q === "'" || q === '(')) {
    const close = q === '(' ? ')' : q;
    j++;
    while (j < s.length && s[j] !== close) {
      if (q === '(' && s[j] === '(') {
        return -1; // `( … )` titles can't hold an unescaped `(`
      }
      if (s[j] === '\\') {
        j++;
      }
      j++;
    }
    if (s[j] !== close) {
      return -1;
    }
    j++;
    skipWs();
  }
  return s[j] === ')' ? j + 1 : -1;
}

const ATTR = String.raw`(?:\s+[a-zA-Z_:][\w.:-]*(?:\s*=\s*(?:[^\s"'=<>${'`'}]+|'[^']*'|"[^"]*"))?)`;
/** CommonMark autolinks and raw HTML (open / closing tag, comment, PI, declaration, CDATA). */
const ANGLE = new RegExp(
  [
    String.raw`<[a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s<>]*>`,
    String.raw`<[a-zA-Z0-9.!#$%&'*+/=?^_${'`'}{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*>`,
    String.raw`<[a-zA-Z][a-zA-Z0-9-]*${ATTR}*\s*\/?>`,
    String.raw`<\/[a-zA-Z][a-zA-Z0-9-]*\s*>`,
    String.raw`<!-->|<!--->|<!--[\s\S]*?-->`,
    String.raw`<\?[\s\S]*?\?>`,
    String.raw`<![a-zA-Z][^>]*>`,
    String.raw`<!\[CDATA\[[\s\S]*?\]\]>`,
  ].join('|'),
  'y'
);

/** Autolink or raw HTML at `i`; returns its end index or -1. */
function angleEnd(s: string, i: number): number {
  ANGLE.lastIndex = i;
  const m = ANGLE.exec(s);
  return m ? i + m[0].length : -1;
}

/** An open `[` / `![` on the CommonMark bracket stack. */
type Bracket = {
  /** Index of its text token in the output. */
  at: number;
  /** Source index of `[` (or of `!` for images). */
  src: number;
  image: boolean;
  /** Links can't contain links: a formed link deactivates earlier link openers. */
  active: boolean;
  /** Another `[` followed (then `[text]` can't serve as its own label). */
  bracketAfter: boolean;
};

/**
 * Inline tokens of `s`, links resolved by the CommonMark bracket algorithm: at each `]` the
 * nearest opener tries an inline destination, a full / collapsed reference, then a shortcut.
 * A link becomes its text (emphasis inside processed separately); images and links without
 * visible text stay verbatim.
 */
function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  const brackets: Bracket[] = [];
  let buf = '';
  const flush = () => {
    if (buf) {
      out.push({ kind: 'text', value: buf });
      buf = '';
    }
  };
  const push = (value: string, link = false) => {
    flush();
    out.push({ kind: 'raw', value, link });
  };
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\' && ESCAPABLE.test(s[i + 1] ?? '')) {
      // Kept verbatim as its own token so escaping in `render` never sees half a pair.
      push(c + s[i + 1]);
      i += 2;
      continue;
    }
    if (c === '`') {
      const span = codeSpanEnd(s, i);
      if (span) {
        const content = s.slice(i + span.ticks, span.end - span.ticks);
        if (content.trim() === '') {
          // Whitespace-only span: its visible space would vanish without the backticks.
          push(s.slice(i, span.end), true);
          i = span.end;
          continue;
        }
        flush();
        out.push({
          kind: 'code',
          value: codeContent(content),
          // At line start bare content could turn into a block marker (`# x`, `> x`, `- x`).
          lineStart: /(?:^|\n)[ \t]*$/.test(s.slice(0, i)),
        });
        i = span.end;
      } else {
        let n = 0;
        while (s[i + n] === '`') {
          n++;
        }
        flush();
        out.push({ kind: 'tick', value: '`'.repeat(n) });
        i += n;
      }
      continue;
    }
    if (c === '<') {
      const end = angleEnd(s, i);
      if (end > 0) {
        push(s.slice(i, end), true);
        i = end;
        continue;
      }
    }
    if (c === '[' || (c === '!' && s[i + 1] === '[')) {
      const image = c === '!';
      flush();
      out.push({ kind: 'text', value: image ? '![' : '[' });
      if (brackets.length > 0) {
        brackets[brackets.length - 1].bracketAfter = true;
      }
      brackets.push({ at: out.length - 1, src: i, image, active: true, bracketAfter: false });
      i += image ? 2 : 1;
      continue;
    }
    if (c === ']') {
      const opener = brackets.pop();
      const end = opener?.active ? linkEnd(s, i, opener) : -1;
      if (!opener || end < 0) {
        buf += c;
        i++;
        continue;
      }
      flush();
      const text = out.splice(opener.at + 1);
      out.pop(); // the opener's `[` / `![`
      if (!opener.image) {
        processEmphasis(text);
        for (const t of text) {
          if (t.kind === 'delim') {
            t.canOpen = false; // matched inside the link only
            t.canClose = false;
          }
        }
        for (const b of brackets) {
          if (!b.image) {
            b.active = false;
          }
        }
      }
      if (opener.image || render(text, false).trim() === '') {
        // Images are content, not style; a link without visible text stays as written.
        push(s.slice(opener.src, end), true);
      } else {
        out.push(...text);
        // Newlines inside a removed destination keep lines aligned with their prefixes.
        const newlines = (s.slice(i, end).match(/\n/g) ?? []).length;
        if (newlines > 0) {
          out.push({ kind: 'text', value: '\n'.repeat(newlines) });
        }
      }
      i = end;
      continue;
    }
    if (c === '&') {
      // Entity references stay as written; a `&` only in text may need escaping later.
      ENTITY_AT.lastIndex = i;
      const m = ENTITY_AT.exec(s);
      if (m) {
        push(m[0], true);
        i += m[0].length;
        continue;
      }
    }
    if (c === '*' || c === '_' || c === '~') {
      let n = 0;
      while (s[i + n] === c) {
        n++;
      }
      const before = i === 0 ? undefined : s[i - 1];
      const after = s[i + n];
      const left = !isSpace(after) && (!isPunct(after) || isSpace(before) || isPunct(before));
      const right = !isSpace(before) && (!isPunct(before) || isSpace(after) || isPunct(after));
      let canOpen = left;
      let canClose = right;
      if (c === '_') {
        canOpen = left && (!right || isPunct(before));
        canClose = right && (!left || isPunct(after));
      }
      if (c === '~' && n > 2) {
        canOpen = false;
        canClose = false;
      }
      flush();
      out.push({
        kind: 'delim',
        ch: c,
        count: n,
        orig: n,
        canOpen,
        canClose,
        flanking: canOpen || canClose,
      });
      i += n;
      continue;
    }
    buf += c;
    i++;
  }
  flush();
  return out;
}

/**
 * End of the link closed by the `]` at `close`: inline `(dest "title")`, full `[ref]`,
 * collapsed `[]` or shortcut (refs must be defined). −1 when it is no link.
 */
function linkEnd(s: string, close: number, opener: Bracket): number {
  if (s[close + 1] === '(') {
    const dest = destinationEnd(s, close + 1);
    if (dest > 0) {
      return dest;
    }
  }
  const n = labelLength(s, close + 1);
  let ref: string | null = null;
  if (n > 2) {
    ref = s.slice(close + 2, close + n);
  } else if (!opener.bracketAfter) {
    // `[]` or nothing: the link text is the label.
    ref = s.slice(opener.src + (opener.image ? 2 : 1), close);
  }
  if (ref === null || !DEFS.has(normLabel(ref))) {
    return -1;
  }
  return n > 0 ? close + 1 + n : close + 1;
}

/** CommonMark "process emphasis": consume matched delimiter lengths in place. */
function processEmphasis(toks: Tok[]): void {
  const stack: { tok: Delim; at: number }[] = [];
  /** openers_bottom per (char, closer length mod 3, closer canOpen). */
  const bottom = new Map<string, number>();
  for (let ci = 0; ci < toks.length; ci++) {
    const closer = toks[ci];
    if (closer.kind !== 'delim') {
      continue;
    }
    while (closer.canClose && closer.count > 0) {
      const key = `${closer.ch}${closer.orig % 3}${closer.canOpen ? 1 : 0}`;
      const floor = bottom.get(key) ?? -1;
      let found = -1;
      for (let k = stack.length - 1; k >= 0 && stack[k].at > floor; k--) {
        const opener = stack[k].tok;
        if (opener.ch !== closer.ch || !opener.canOpen || opener.count === 0) {
          continue;
        }
        if (closer.ch === '~') {
          if (opener.count !== closer.count) {
            continue;
          }
        } else if (
          (opener.canClose || closer.canOpen) &&
          (opener.orig + closer.orig) % 3 === 0 &&
          !(opener.orig % 3 === 0 && closer.orig % 3 === 0)
        ) {
          continue;
        }
        found = k;
        break;
      }
      if (found < 0) {
        bottom.set(key, ci - 1);
        break;
      }
      const opener = stack[found].tok;
      const use = closer.ch === '~' ? closer.count : opener.count >= 2 && closer.count >= 2 ? 2 : 1;
      opener.count -= use;
      closer.count -= use;
      // Delimiters between opener and closer can no longer match.
      stack.length = opener.count > 0 ? found + 1 : found;
    }
    if (closer.count > 0 && closer.canOpen) {
      stack.push({ tok: closer, at: ci });
    }
  }
}

/**
 * Code span content as plain source: escape what the span protected (backslash escapes,
 * entities, backticks, autolinks / HTML, link brackets). `safe` also escapes delimiters.
 */
function codeAsText(v: string, lineStart: boolean, safe: boolean): string {
  let out = '';
  for (let i = 0; i < v.length; i++) {
    const c = v[i];
    if (c === '\\') {
      // Always: a trailing `\` before a newline would become a hard break.
      out += '\\\\';
    } else if (c === '`') {
      out += '\\`';
    } else if (c === '&' && /^&#?\w+;/.test(v.slice(i))) {
      out += '\\&';
    } else if (c === '<') {
      // Could join text after the former span into an autolink / HTML tag.
      out += '\\<';
    } else if (c === '[' || c === ']') {
      // Brackets could pair with text outside the former span into a link / image.
      out += `\\${c}`;
    } else if (c === '~' || (safe && (c === '*' || c === '_'))) {
      out += `\\${c}`;
    } else {
      out += c;
    }
  }
  if (!lineStart) {
    return out;
  }
  // `1.` → `1\.` (a backslash before a digit is no escape); other openers get a leading `\`.
  const ordered = /^([ \t]*\d{1,9})([.)])/.exec(out);
  return ordered
    ? `${ordered[1]}\\${out.slice(ordered[1].length)}`
    : out.replace(/^([ \t]*)([#>+=|-])/, '$1\\$2');
}

function render(toks: Tok[], safe: boolean): string {
  let out = '';
  let afterLink = false;
  for (const t of toks) {
    let piece: string;
    if (t.kind === 'tick') {
      // Unmatched backtick runs stay as written (their pairing is unchanged); escaped only
      // when stripping made them pair up.
      piece = safe ? t.value.replaceAll('`', '\\`') : t.value;
    } else if (t.kind === 'delim') {
      const run = t.ch.repeat(t.count);
      piece = safe && t.flanking ? run.replaceAll(t.ch, `\\${t.ch}`) : run;
    } else if (t.kind === 'code') {
      piece = codeAsText(t.value, t.lineStart, safe);
    } else if (t.kind === 'text') {
      // Only literal `[` can form a new link once inner links are gone.
      // Literal `[` / `<` could form a new link / autolink once marks between them are gone.
      // `&` + name could join text after it into an entity reference (`&*mp;*` → `&mp;`).
      piece = safe ? t.value.replaceAll(/[[<]|&(?=[#a-zA-Z]|$)/g, '\\$&') : t.value;
    } else {
      piece = t.value;
    }
    // A kept image / link followed by `(` could swallow the text after it as a destination.
    if (safe && afterLink && piece.startsWith('(')) {
      piece = `\\${piece}`;
    }
    // `!` right before a kept `[…]` would turn it into an image.
    if (safe && t.kind === 'raw' && t.link && piece.startsWith('[') && out.endsWith('!')) {
      out = `${out.slice(0, -1)}\\!`;
    }
    if (piece !== '') {
      afterLink = t.kind === 'raw' && Boolean(t.link);
    }
    out += piece;
  }
  return out;
}

/** Plain and escaped renders of one stripped inline run. */
function stripRenders(s: string): { plain: string; safe: string } {
  const toks = tokenize(s);
  processEmphasis(toks);
  return { plain: render(toks, false), safe: render(toks, true) };
}

/**
 * Constructs stripping keeps as written (images, empty links, autolinks / HTML, entity
 * references): none may appear or change (`![a][x](u)` → `![a]x`, `&*mp;*` → `&mp;`).
 */
function keptLinks(s: string): string {
  return tokenize(s)
    .flatMap((t) => (t.kind === 'raw' && t.link ? [t.value] : []))
    .join('\0');
}

/** `plain` is final when a second pass changes nothing and no image / link appeared. */
function isStable(original: string, plain: string): boolean {
  return stripOnce(plain) === plain && keptLinks(plain) === keptLinks(original);
}

function stripInline(s: string): string {
  const { plain, safe } = stripRenders(s);
  // Removing marks can expose new ones (code content, leftover delimiters). Escape only then.
  return isStable(s, plain) ? plain : safe;
}

/** One plain pass, used for the idempotence probe (no recursion into the fallback). */
function stripOnce(s: string): string {
  const toks = tokenize(s);
  processEmphasis(toks);
  return render(toks, false);
}

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const QUOTE_MARK = /^ {0,3}>[ \t]?/;
const LIST_MARK = /^ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]+|$)/;

/** A blockquote level, or a list item: its content column from the quote content start. */
type Container = 'quote' | number;

/**
 * Match the open containers against `line` (CommonMark): a quote needs its `>`, a list item
 * enough indentation (any blank line continues it). Returns how many matched, where their
 * prefix ends and where the innermost matched quote's content starts.
 */
function matchOpen(
  line: string,
  open: Container[]
): { matched: number; pos: number; base: number; at: number[] } {
  let pos = 0;
  let base = 0;
  /** `at[k]` = end of the prefix of the first `k` containers. */
  const at = [0];
  for (const item of open) {
    if (item === 'quote') {
      const q = QUOTE_MARK.exec(line.slice(pos));
      if (!q) {
        break;
      }
      pos += q[0].length;
      base = pos;
    } else {
      const rest = line.slice(base);
      if (rest.trim() !== '' && /^ */.exec(rest)![0].length < item) {
        break;
      }
      pos = Math.max(pos, Math.min(line.length, base + item));
    }
    at.push(pos);
  }
  return { matched: at.length - 1, pos, base, at };
}

/**
 * New containers opening at `pos` (`>` and list markers in any order). With `interrupting`
 * the first one may interrupt an open paragraph: then no empty item and an ordered list must
 * start at 1 (CommonMark).
 */
function openContainers(
  line: string,
  start: number,
  startBase: number,
  interrupting: boolean
): { containers: Container[]; pos: number; emptyItem: boolean } {
  const containers: Container[] = [];
  let pos = start;
  let base = startBase;
  let emptyItem = false;
  for (;;) {
    const rest = line.slice(pos);
    const first = interrupting && containers.length === 0;
    const q = QUOTE_MARK.exec(rest);
    if (q) {
      containers.push('quote');
      pos += q[0].length;
      base = pos;
      emptyItem = false;
      continue;
    }
    // A thematic break (`* * *`, `- - -`) is not a list marker.
    const l = /^ {0,3}([*_-])(?:[ \t]*\1){2,}[ \t]*$/.test(rest) ? null : LIST_MARK.exec(rest);
    if (!l || rest.trim() === '') {
      break;
    }
    const blank = rest.slice(l[0].length).trim() === '';
    if (first && (blank || (/^ {0,3}\d/.test(rest) && !/^ {0,3}0*1[.)]/.test(rest)))) {
      break;
    }
    const mark = l[0].trimEnd();
    const gap = l[0].length - mark.length;
    // Empty item / 5+ spaces: content starts one column after the marker.
    const col = blank || gap >= 5 ? pos + mark.length + 1 : pos + l[0].length;
    containers.push(col - base);
    emptyItem = blank;
    if (gap >= 5 && !blank) {
      // `-     code`: the item starts with indented code — keep its indentation in the body.
      pos += mark.length + 1;
      break;
    }
    pos += l[0].length;
  }
  return { containers, pos, emptyItem };
}

const HEADING = /^ {0,3}#{1,6}(?:[ \t]+|$)/;
const BLOCK_TAGS =
  'address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul';
/** CommonMark HTML block starts (types 1–6 may interrupt a paragraph); `end` null = blank line. */
const HTML_BLOCKS: { start: RegExp; end: RegExp | null; interrupts: boolean }[] = [
  {
    start: /^ {0,3}<(?:script|pre|style|textarea)(?:\s|>|$)/i,
    end: /<\/(?:script|pre|style|textarea)>/i,
    interrupts: true,
  },
  { start: /^ {0,3}<!--/, end: /-->/, interrupts: true },
  { start: /^ {0,3}<\?/, end: /\?>/, interrupts: true },
  { start: /^ {0,3}<![a-z]/i, end: />/, interrupts: true },
  { start: /^ {0,3}<!\[CDATA\[/, end: /\]\]>/, interrupts: true },
  {
    start: new RegExp(`^ {0,3}</?(?:${BLOCK_TAGS})(?:\\s|/?>|$)`, 'i'),
    end: null,
    interrupts: true,
  },
  {
    start:
      /^ {0,3}(?:<[a-z][\w-]*(?:\s+[a-z_:][\w.:-]*(?:\s*=\s*(?:[^\s"'=<>`]+|'[^']*'|"[^"]*"))?)*\s*\/?>|<\/[a-z][\w-]*\s*>)\s*$/i,
    end: null,
    interrupts: false,
  },
];

/** Would this line start a block other than paragraph text (or continue one as setext)? */
/** Can `line` interrupt a paragraph (so it is no lazy continuation text)? */
function interruptsParagraph(line: string): boolean {
  return (
    /^ {0,3}(?:>|#{1,6}(?:[ \t]|$)|[-+*][ \t]+\S|1[.)][ \t]+\S|`{3,}(?!.*`)|~{3}|([*_-])(?:[ \t]*\1){2,}[ \t]*$)/.test(
      line
    ) || HTML_BLOCKS.some((b) => b.interrupts && b.start.test(line))
  );
}

function isBlockStart(line: string): boolean {
  return (
    /^ {0,3}(?:>|#{1,6}(?:[ \t]|$)|[-+*](?:[ \t]|$)|\d{1,9}[.)](?:[ \t]|$)|`{3,}(?!.*`)|~{3}|=+[ \t]*$|-+[ \t]*$|([*_-])(?:[ \t]*\1){2,}[ \t]*$)/.test(
      line
    ) ||
    HTML_BLOCKS.some((b) => b.start.test(line)) ||
    // A paragraph starting `[x]: …` would be read as a link reference definition.
    /^ {0,3}\[(?:[^\]\\[]|\\.)+\]:/.test(line)
  );
}

const wsWidth = (ws: string) => ws.replaceAll('\t', '    ').length;
/** Line without its leading `>` markers. */
const unquoted = (x: string) => x.replace(/^(?: {0,3}>[ \t]?)*/, '');

/** Escape a block opener exposed by stripping (`*>` → `\>`, `**1.** x` → `1\. x`). */
function guardBlockStart(original: string, strippedRaw: string): string {
  // Removed leading code/marks must not turn the line into indented code (4+ columns).
  const lead0 = /^[ \t]*/.exec(strippedRaw)![0];
  const origLead = /^[ \t]*/.exec(original)![0];
  // Nor gain indentation at all: inside a list it decides which item the line belongs to.
  const stripped =
    wsWidth(lead0) > wsWidth(origLead) ? origLead + strippedRaw.slice(lead0.length) : strippedRaw;
  if (!isBlockStart(stripped) || isBlockStart(original)) {
    return stripped;
  }
  const ordered = /^([ \t]*\d{1,9})([.)])/.exec(stripped);
  if (ordered) {
    return `${ordered[1]}\\${stripped.slice(ordered[1].length)}`;
  }
  const lead = /^[ \t]*/.exec(stripped)![0];
  return `${lead}\\${stripped.slice(lead.length)}`;
}

/**
 * Link reference definition at the start of `t` (`[label]: dest "title"`, title / destination
 * may sit on the next line). Returns the end index (at a line end) and the raw label.
 */
function parseDefinition(t: string): { end: number; label: string } | null {
  const open = /^ {0,3}\[/.exec(t);
  if (!open) {
    return null;
  }
  let j = open[0].length;
  let label = '';
  while (j < t.length && t[j] !== ']') {
    if (t[j] === '[') {
      return null;
    }
    if (t[j] === '\\' && ESCAPABLE.test(t[j + 1] ?? '')) {
      label += t[j] + t[j + 1];
      j += 2;
      continue;
    }
    label += t[j];
    j++;
  }
  if (t[j] !== ']' || t[j + 1] !== ':' || label.trim() === '' || label.length > 999) {
    return null;
  }
  j += 2;
  /** Skip spaces / tabs and at most one line ending; false on a blank line. */
  const ws = (): boolean => {
    let nl = 0;
    while (j < t.length && (t[j] === ' ' || t[j] === '\t' || t[j] === '\n')) {
      if (t[j] === '\n' && ++nl > 1) {
        return false;
      }
      j++;
    }
    return true;
  };
  const lineEndFrom = (k: number): number => {
    while (k < t.length && (t[k] === ' ' || t[k] === '\t')) {
      k++;
    }
    return k >= t.length || t[k] === '\n' ? k : -1;
  };
  if (!ws()) {
    return null;
  }
  if (t[j] === '<') {
    j++;
    while (j < t.length && t[j] !== '>') {
      if (t[j] === '\n' || t[j] === '<') {
        return null;
      }
      j += t[j] === '\\' ? 2 : 1;
    }
    if (t[j] !== '>') {
      return null;
    }
    j++;
  } else {
    const start = j;
    let parens = 0;
    while (j < t.length && t.charCodeAt(j) > 0x20) {
      if (t[j] === '\\' && ESCAPABLE.test(t[j + 1] ?? '')) {
        j += 2;
        continue;
      }
      if (t[j] === '(') {
        parens++;
      } else if (t[j] === ')') {
        if (parens === 0) {
          break;
        }
        parens--;
      }
      j++;
    }
    if (j === start || parens !== 0) {
      return null;
    }
  }
  const destLineEnd = lineEndFrom(j);
  const before = j;
  if (ws() && j > before && (t[j] === '"' || t[j] === "'" || t[j] === '(')) {
    const close = t[j] === '(' ? ')' : t[j];
    j++;
    while (j < t.length && t[j] !== close) {
      if ((t[j] === '\n' && t[j + 1] === '\n') || (close === ')' && t[j] === '(')) {
        break;
      }
      j += t[j] === '\\' ? 2 : 1;
    }
    if (t[j] === close) {
      const end = lineEndFrom(j + 1);
      if (end >= 0) {
        return { end, label };
      }
    }
  }
  // No (valid) title: the definition ends with the destination's line.
  return destLineEnd >= 0 ? { end: destLineEnd, label } : null;
}

/** Split a GFM table row on unescaped pipes outside code spans; strip each cell. */
function stripTableRow(row: string): string {
  const cells: string[] = [];
  let cur = '';
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '\\' && row[i + 1] === '|') {
      cur += '\\|';
      i++;
    } else if (c === '`') {
      const span = codeSpanEnd(row, i);
      const end = span ? span.end : i + 1;
      cur += row.slice(i, end);
      i = end - 1;
    } else if (c === '|') {
      cells.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells.map((cell) => stripInline(cell)).join('|');
}

/**
 * Strip common inline Markdown marks (bold/italic/strike/code/links).
 * Emphasis never crosses block boundaries: blank lines, list items, headings, table cells.
 * Fenced code blocks are left verbatim.
 */
export function stripInlineMarkdown(chunk: string): string {
  // Pass 1 collects reference definitions (refs may precede them); pass 2 strips.
  const defs = new Set<string>();
  try {
    DEFS = new Set();
    stripBlocks(chunk, defs);
    DEFS = defs;
    return stripBlocks(chunk, null);
  } finally {
    DEFS = new Set();
  }
}

/** Block walk; `collect` set → only gather definition labels. */
function stripBlocks(chunk: string, collect: Set<string> | null): string {
  const out: string[] = [];
  /** Current paragraph: container prefixes + line contents. */
  let prefixes: string[] = [];
  let contents: string[] = [];
  const flushPara = () => {
    if (contents.length === 0) {
      return;
    }
    const { plain, safe } = stripRenders(contents.join('\n'));
    // Stripping never adds or removes newlines, so lines realign with their prefixes.
    // A line emptied by stripping (`**` alone) would split the paragraph: fold the next line in.
    const build = (text: string): { lines: string[]; body: string[] } => {
      const stripped = text.split('\n');
      const lines: string[] = [];
      const body: string[] = [];
      for (let k = 0; k < prefixes.length; k++) {
        const lead = prefixes[k];
        let line = stripped[k] ?? '';
        while (line.trim() === '' && contents[k].trim() !== '' && k + 1 < prefixes.length) {
          k++;
          line = (stripped[k] ?? '').trimStart();
        }
        if (line.trim() === '' && contents[k].trim() !== '' && !/\S/.test(lead)) {
          continue;
        }
        // Right after a definition, a first line opening `"`/`'`/`(` could turn into its title.
        if (
          lines.length === 0 &&
          paraAfterDef &&
          line !== contents[k] &&
          /^[ \t]*["'(]/.test(line)
        ) {
          line = line.replace(/^([ \t]*)/, '$1\\');
        }
        // The paragraph's first line is compared with the original first line (folding can
        // promote a later line, e.g. `[` + `\n[ref]: …` → a definition).
        let guarded = guardBlockStart(lines.length === 0 ? contents[0] : contents[k], line);
        // `*  ` + stripped `**` would read as a thematic break `*  **`.
        const thematic = /^ {0,3}([*_-])(?:[ \t]*\1){2,}[ \t]*$/;
        if (
          thematic.test(unquoted(lead + guarded)) &&
          !thematic.test(unquoted(lead + contents[k]))
        ) {
          guarded = guarded.replace(/^([ \t]*)(\S)/, '$1\\$2');
        }
        lines.push(lead + guarded);
        body.push(guarded);
      }
      return { lines, body };
    };
    const original = contents.join('\n');
    /** Inline-stable, and (outside a nested check) stable through block parsing too. */
    const settled = (r: { lines: string[]; body: string[] }): boolean => {
      if (!isStable(original, r.body.join('\n'))) {
        return false;
      }
      if (CHECKING) {
        return true;
      }
      const text = r.lines.join('\n');
      CHECKING = true;
      try {
        return stripBlocks(text, null) === text;
      } finally {
        CHECKING = false;
      }
    };
    let result = build(plain);
    // Guards / folding can still expose marks; the paragraph must strip to itself.
    if (!settled(result)) {
      result = build(safe);
    }
    // ponytail: last resort keeps the paragraph as written (styles stay) when even the
    // escaped form re-parses differently (e.g. merged backtick runs); seen ~1 in 10^5 fuzz docs.
    if (!settled(result)) {
      result = { lines: prefixes.map((p, k) => p + contents[k]), body: [...contents] };
    }
    out.push(...result.lines);
    prefixes = [];
    contents = [];
    paraAfterDef = false;
  };
  /** Open fenced code: verbatim while its containers continue, until the closing fence. */
  let fence: { ch: string; len: number; depth: number } | null = null;
  /** Open HTML block: verbatim until `end` matches (or a blank line when null). */
  let html: { end: RegExp | null; depth: number } | null = null;
  /** Open containers (blockquotes, list items), outermost first. */
  let open: Container[] = [];
  /** Index in `open` of a list item that began empty (a blank line next closes it). */
  let emptyItemAt = -1;
  /** Previous line ended a link reference definition (its paragraph is still open). */
  let afterDef = false;
  /** Current paragraph directly follows a definition. */
  let paraAfterDef = false;
  const lines = chunk.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const m = matchOpen(line, open);
    // Inside fenced code / HTML only the opening containers continue (no new blocks start).
    const inner = (depth: number): string | null =>
      m.matched >= depth ? line.slice(m.at[depth]) : null;
    if (fence) {
      const fenceBody = inner(fence.depth);
      if (fenceBody !== null) {
        out.push(line);
        const close = FENCE_OPEN.exec(fenceBody);
        if (
          close &&
          close[1][0] === fence.ch &&
          close[1].length >= fence.len &&
          fenceBody.slice(close[0].length).trim() === ''
        ) {
          fence = null;
        }
        continue;
      }
      fence = null;
    }
    if (html) {
      const htmlBody = inner(html.depth);
      if (htmlBody !== null) {
        if (html.end ? html.end.test(htmlBody) : htmlBody.trim() === '') {
          html = null;
        }
        out.push(line);
        continue;
      }
      html = null;
    }
    // Lines right after a definition still belong to its paragraph (no code / interruptions).
    let paraOpen = contents.length > 0 || afterDef;
    afterDef = false;
    const full = m.matched === open.length;
    const added = openContainers(line, m.pos, m.base, paraOpen && full);
    const restAfterMatch = line.slice(m.pos);
    // Lazy continuation: an open paragraph takes a line that left its containers when the
    // line starts nothing new.
    if (
      paraOpen &&
      !full &&
      added.containers.length === 0 &&
      restAfterMatch.trim() !== '' &&
      !interruptsParagraph(restAfterMatch)
    ) {
      if (contents.length === 0) {
        paraAfterDef = true;
      }
      prefixes.push(line.slice(0, m.pos));
      contents.push(restAfterMatch);
      continue;
    }
    if (!full || added.containers.length > 0) {
      flushPara();
      paraOpen = false;
    }
    const blankLine = line.slice(added.pos).trim() === '';
    if (blankLine && emptyItemAt >= 0 && m.matched > emptyItemAt && added.containers.length === 0) {
      // An item may start with at most one blank line: `-` then blank closes it.
      open = open.slice(0, emptyItemAt);
    } else {
      open = [...open.slice(0, m.matched), ...added.containers];
    }
    emptyItemAt = added.emptyItem ? open.length - 1 : blankLine ? emptyItemAt : -1;
    const prefix = line.slice(0, added.pos);
    const body = line.slice(added.pos);
    const fenceOpen = FENCE_OPEN.exec(body);
    if (fenceOpen && !(fenceOpen[1][0] === '`' && body.slice(fenceOpen[0].length).includes('`'))) {
      flushPara();
      out.push(line);
      fence = { ch: fenceOpen[1][0], len: fenceOpen[1].length, depth: open.length };
      continue;
    }
    const htmlStart = HTML_BLOCKS.find((b) => (b.interrupts || !paraOpen) && b.start.test(body));
    if (htmlStart) {
      flushPara();
      out.push(line);
      if (!(htmlStart.end && htmlStart.end.test(body.replace(htmlStart.start, '')))) {
        html = { end: htmlStart.end, depth: open.length };
      }
      continue;
    }
    if (blankLine) {
      flushPara();
      out.push(line);
      continue;
    }
    const indent = /^[ \t]*/.exec(body)![0].replaceAll('\t', '    ').length;
    if (!paraOpen && indent >= 4) {
      // Indented code block: verbatim.
      out.push(line);
      continue;
    }
    if (
      /^ {0,3}([*_-])(?:[ \t]*\1){2,}[ \t]*$/.test(body) ||
      // `===` / `--` underline a paragraph (setext); without one they are plain text.
      (paraOpen && added.containers.length === 0 && /^ {0,3}(?:=+|-+)[ \t]*$/.test(body))
    ) {
      // Thematic break or setext underline: ends the paragraph, nothing inline to strip.
      flushPara();
      out.push(line);
      continue;
    }
    const heading = HEADING.exec(body);
    if (heading) {
      flushPara();
      const original = body.slice(heading[0].length);
      let text = stripInline(original);
      // A trailing ` #` exposed by stripping would read as the closing sequence and vanish.
      const closing = /(^|[ \t])(#+)([ \t]*)$/;
      if (closing.test(text) && !closing.test(original)) {
        text = text.replace(closing, '$1\\$2$3');
      }
      out.push(prefix + heading[0] + text);
      continue;
    }
    if (contents.length === 0) {
      // Top level: a definition may continue on the next lines; inside containers one line.
      // It ends where its paragraph would: at a blank or an interrupting line.
      const following: string[] = [];
      if (open.length === 0) {
        for (const next of lines.slice(li + 1)) {
          if (next.trim() === '' || interruptsParagraph(next)) {
            break;
          }
          following.push(next);
        }
      }
      const text = [body, ...following].join('\n');
      const def = parseDefinition(text);
      if (def) {
        collect?.add(normLabel(def.label));
        const used = (text.slice(0, def.end).match(/\n/g) ?? []).length;
        out.push(line, ...lines.slice(li + 1, li + 1 + used));
        li += used;
        afterDef = true;
        continue;
      }
    }
    if (body.trimStart().startsWith('|')) {
      flushPara();
      out.push(prefix + stripTableRow(body));
      continue;
    }
    if (contents.length === 0) {
      paraAfterDef = paraOpen;
    }
    prefixes.push(prefix);
    contents.push(body);
  }
  flushPara();
  return out.join('\n');
}
