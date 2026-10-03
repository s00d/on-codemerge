/** Cursor helpers for mermaid-subset lines — char-index, no regex soup. */

export function skipWs(s: string, i: number): number {
  while (i < s.length) {
    const c = s.charCodeAt(i);
    if (c !== 32 && c !== 9) {
      break;
    }
    i += 1;
  }
  return i;
}

function isIdChar(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 95;
}

/** Take identifier; stops before arrows (`--`, `->`, `-x`, `-.`). Allows `my-node`. */
export function takeId(s: string, i: number): { value: string; next: number } | null {
  i = skipWs(s, i);
  if (i >= s.length || !isIdChar(s.charCodeAt(i))) {
    return null;
  }
  let j = i + 1;
  while (j < s.length) {
    const c = s.charCodeAt(j);
    if (c === 45) {
      const n = s.charCodeAt(j + 1);
      // Arrow prefixes: `--`, `->`, `-x`, `-.` — never part of id.
      if (n === 45 || n === 62 || n === 120 || n === 88 || n === 46) {
        break;
      }
      if (!isIdChar(n)) {
        break;
      }
      j += 1;
      continue;
    }
    if (!isIdChar(c)) {
      break;
    }
    j += 1;
  }
  return { value: s.slice(i, j), next: j };
}

/** Longer tokens first so `-->>` / `--x` win over `-->`, `-x` over `->`. */
const ARROWS = [
  '-.->',
  '-->>',
  '--x',
  '->>',
  '-->',
  '==>',
  '--)',
  '-x',
  '-)',
  '-.-',
  '---',
  '->',
] as const;

export function takeArrow(s: string, i: number): { value: string; next: number } | null {
  i = skipWs(s, i);
  for (const a of ARROWS) {
    if (s.startsWith(a, i)) {
      return { value: a, next: i + a.length };
    }
  }
  return null;
}

export function takeQuoted(s: string, i: number): { value: string; next: number } | null {
  i = skipWs(s, i);
  if (s[i] !== '"') {
    return null;
  }
  const end = s.indexOf('"', i + 1);
  if (end === -1) {
    return null;
  }
  return { value: s.slice(i + 1, end), next: end + 1 };
}

export function startsWithWord(s: string, word: string): boolean {
  if (s.length < word.length) {
    return false;
  }
  for (let k = 0; k < word.length; k += 1) {
    const a = s.charCodeAt(k);
    const b = word.charCodeAt(k);
    const al = a >= 65 && a <= 90 ? a + 32 : a;
    const bl = b >= 65 && b <= 90 ? b + 32 : b;
    if (al !== bl) {
      return false;
    }
  }
  if (s.length === word.length) {
    return true;
  }
  const next = s.charCodeAt(word.length);
  return next === 32 || next === 9;
}

export function eqIgnoreCase(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let k = 0; k < a.length; k += 1) {
    const ac = a.charCodeAt(k);
    const bc = b.charCodeAt(k);
    const al = ac >= 65 && ac <= 90 ? ac + 32 : ac;
    const bl = bc >= 65 && bc <= 90 ? bc + 32 : bc;
    if (al !== bl) {
      return false;
    }
  }
  return true;
}

export function takeNumber(s: string, i: number): { value: number; next: number } | null {
  i = skipWs(s, i);
  let j = i;
  while (j < s.length && s.charCodeAt(j) >= 48 && s.charCodeAt(j) <= 57) {
    j += 1;
  }
  if (j < s.length && s[j] === '.') {
    j += 1;
    while (j < s.length && s.charCodeAt(j) >= 48 && s.charCodeAt(j) <= 57) {
      j += 1;
    }
  }
  if (j === i) {
    return null;
  }
  return { value: Number(s.slice(i, j)), next: j };
}

export function restTrim(s: string, i: number): string {
  return s.slice(skipWs(s, i));
}

/** Strip one pair of surrounding `"` if present. */
export function stripOuterQuotes(s: string): string {
  if (s.length >= 2 && s.charCodeAt(0) === 34 && s.charCodeAt(s.length - 1) === 34) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Mermaid labels may use HTML `<br/>` / `<br>` / `<br />` — normalize to `\n`.
 * Char-scan (no RegExp).
 */
export function normalizeBrLabel(s: string): string {
  if (s.indexOf('<') === -1) {
    return s;
  }
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s.charCodeAt(i) === 60 /* < */) {
      const n1 = s.charCodeAt(i + 1);
      const n2 = s.charCodeAt(i + 2);
      // <br …>
      if ((n1 === 98 || n1 === 66) && (n2 === 114 || n2 === 82)) {
        let j = i + 3;
        while (j < s.length && (s.charCodeAt(j) === 32 || s.charCodeAt(j) === 9)) {
          j += 1;
        }
        if (s.charCodeAt(j) === 47 /* / */) {
          j += 1;
        }
        while (j < s.length && (s.charCodeAt(j) === 32 || s.charCodeAt(j) === 9)) {
          j += 1;
        }
        if (s.charCodeAt(j) === 62 /* > */) {
          out += '\n';
          i = j + 1;
          continue;
        }
      }
    }
    out += s[i];
    i += 1;
  }
  return out;
}

/** Find first `YYYY-MM-DD` starting at or after `i`; returns day-string slice + next index. */
export function takeIsoDate(s: string, i = 0): { value: string; next: number } | null {
  for (let p = i; p + 10 <= s.length; p += 1) {
    if (s.charCodeAt(p + 4) !== 45 || s.charCodeAt(p + 7) !== 45) {
      continue;
    }
    let ok = true;
    for (const off of [0, 1, 2, 3, 5, 6, 8, 9]) {
      const c = s.charCodeAt(p + off);
      if (c < 48 || c > 57) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return { value: s.slice(p, p + 10), next: p + 10 };
    }
  }
  return null;
}

export type ForEachLineOpts = { semicolon?: boolean };

/** Iterate non-empty logical lines; optional `;` as line break (flowchart headers). */
export function forEachLine(
  source: string,
  fn: (line: string) => void,
  opts: ForEachLineOpts = {}
): void {
  const semi = opts.semicolon === true;
  let start = 0;
  for (let i = 0; i <= source.length; i += 1) {
    const c = i < source.length ? source.charCodeAt(i) : 10;
    const breakAt = c === 10 || c === 13 || (semi && c === 59);
    if (!breakAt && i < source.length) {
      continue;
    }
    // skip \r\n as one break
    let end = i;
    if (c === 13 && source.charCodeAt(i + 1) === 10) {
      i += 1;
    }
    let a = start;
    let b = end;
    while (a < b && (source.charCodeAt(a) === 32 || source.charCodeAt(a) === 9)) {
      a += 1;
    }
    while (b > a && (source.charCodeAt(b - 1) === 32 || source.charCodeAt(b - 1) === 9)) {
      b -= 1;
    }
    start = i + 1;
    if (a >= b) {
      continue;
    }
    fn(source.slice(a, b));
  }
}

/** Split whitespace-separated tokens without RegExp. */
export function splitWs(s: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    i = skipWs(s, i);
    if (i >= s.length) {
      break;
    }
    let j = i;
    while (j < s.length) {
      const c = s.charCodeAt(j);
      if (c === 32 || c === 9) {
        break;
      }
      j += 1;
    }
    out.push(s.slice(i, j));
    i = j;
  }
  return out;
}
