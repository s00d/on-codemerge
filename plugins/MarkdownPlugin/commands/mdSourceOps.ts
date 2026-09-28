/**
 * Markdown source transforms at caret / selection (CM), analogous to
 * WYSIWYG convertBlockType — retarget the current block, do not append.
 */

export type MdEdit = { text: string; cursor: number };

const HEADING_RE = /^(#{1,6})\s+/;
const QUOTE_RE = /^>\s?/;
const BULLET_RE = /^[-*+]\s+/;
const ORDERED_RE = /^\d+\.\s+/;

function normalizeNl(text: string): string {
  return text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

/** Inclusive line range covering [from, to). */
export function lineRange(
  text: string,
  from: number,
  to: number
): { start: number; end: number; lines: string[] } {
  const src = normalizeNl(text);
  const a = Math.max(0, Math.min(from, to, src.length));
  const b = Math.max(a, Math.min(Math.max(from, to), src.length));
  let start = src.lastIndexOf('\n', Math.max(0, a - 1)) + 1;
  let end = src.indexOf('\n', b);
  if (end < 0) {
    end = src.length;
  }
  // If caret at end of line with selection empty past newline boundary — keep line.
  if (a === b && a > 0 && src[a - 1] === '\n' && a === start) {
    // caret on empty line after newline — start already correct
  }
  const slice = src.slice(start, end);
  return { start, end, lines: slice.length === 0 ? [''] : slice.split('\n') };
}

export function stripBlockPrefix(line: string): string {
  return line
    .replace(HEADING_RE, '')
    .replace(QUOTE_RE, '')
    .replace(BULLET_RE, '')
    .replace(ORDERED_RE, '');
}

function mapLines(
  text: string,
  from: number,
  to: number,
  map: (line: string, index: number) => string
): MdEdit {
  const src = normalizeNl(text);
  const { start, end, lines } = lineRange(src, from, to);
  const nextLines = lines.map(map);
  const block = nextLines.join('\n');
  const next = src.slice(0, start) + block + src.slice(end);
  const cursor = start + block.length;
  return { text: next, cursor };
}

/** Turn current line(s) into ATX heading. */
export function applyHeading(text: string, from: number, to: number, level: number): MdEdit {
  const lv = Math.min(6, Math.max(1, level));
  const marks = '#'.repeat(lv);
  return mapLines(text, from, to, (line) => {
    const body = stripBlockPrefix(line);
    return `${marks} ${body.length > 0 ? body : 'Heading'}`;
  });
}

/** Turn current line(s) into blockquote. */
export function applyQuote(text: string, from: number, to: number): MdEdit {
  return mapLines(text, from, to, (line) => {
    const body = stripBlockPrefix(line);
    return `> ${body.length > 0 ? body : 'Quote'}`;
  });
}

/** Turn current line(s) into bullet list items. */
export function applyBullet(text: string, from: number, to: number): MdEdit {
  return mapLines(text, from, to, (line) => {
    const body = stripBlockPrefix(line);
    return `- ${body.length > 0 ? body : 'Item'}`;
  });
}

/** Turn current line(s) into ordered list items. */
export function applyOrdered(text: string, from: number, to: number): MdEdit {
  return mapLines(text, from, to, (line, index) => {
    const body = stripBlockPrefix(line);
    return `${index + 1}. ${body.length > 0 ? body : 'Item'}`;
  });
}

/** Insert a thematic break on the current (or empty) line. */
export function applyHr(text: string, from: number, to: number): MdEdit {
  const src = normalizeNl(text);
  const { start, end, lines } = lineRange(src, from, to);
  const body = lines.map(stripBlockPrefix).join('\n').trim();
  const insert = body.length === 0 ? '---' : `---\n\n${body}`;
  return { text: src.slice(0, start) + insert + src.slice(end), cursor: start + 3 };
}

/**
 * Wrap / unwrap inline mark markers around the selection.
 * Collapsed caret inserts `before + placeholder + after`.
 */
export function applyInlineMark(
  text: string,
  from: number,
  to: number,
  before: string,
  after: string,
  placeholder = 'text'
): MdEdit {
  const src = normalizeNl(text);
  const a = Math.min(from, to);
  const b = Math.max(from, to);
  if (a !== b) {
    const selected = src.slice(a, b);
    if (
      selected.startsWith(before) &&
      selected.endsWith(after) &&
      selected.length > before.length + after.length
    ) {
      const inner = selected.slice(before.length, selected.length - after.length);
      return { text: src.slice(0, a) + inner + src.slice(b), cursor: a + inner.length };
    }
    if (
      a >= before.length &&
      src.slice(a - before.length, a) === before &&
      src.slice(b, b + after.length) === after
    ) {
      return {
        text: src.slice(0, a - before.length) + selected + src.slice(b + after.length),
        cursor: a - before.length + selected.length,
      };
    }
    const insert = `${before}${selected}${after}`;
    return {
      text: src.slice(0, a) + insert + src.slice(b),
      cursor: a + before.length + selected.length,
    };
  }
  const insert = `${before}${placeholder}${after}`;
  return {
    text: src.slice(0, a) + insert + src.slice(b),
    cursor: a + before.length + placeholder.length,
  };
}

/** Strip common inline Markdown marks (bold/italic/strike/code/links). Skips fenced blocks. */
export function stripInlineMarkdown(chunk: string): string {
  const parts = chunk.split(/(```[\s\S]*?```)/);
  return parts
    .map((part) => {
      if (part.startsWith('```')) {
        return part;
      }
      let out = part;
      let prev = '';
      while (out !== prev) {
        prev = out;
        out = out
          .replace(/\*\*([^*\n]+)\*\*/g, '$1')
          .replace(/__([^_\n]+)__/g, '$1')
          .replace(/~~([^~\n]+)~~/g, '$1')
          .replace(/`([^`\n]+)`/g, '$1')
          .replace(/\*([^*\n]+)\*/g, '$1')
          .replace(/_([^_\n]+)_/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
      }
      return out;
    })
    .join('');
}

/**
 * Clear inline Markdown styles.
 * Collapsed caret → whole document; non-empty selection → selection only.
 */
export function clearMdStyles(text: string, from: number, to: number): MdEdit {
  const src = normalizeNl(text);
  const a = Math.min(from, to);
  const b = Math.max(from, to);
  const start = a === b ? 0 : a;
  const end = a === b ? src.length : b;
  const cleaned = stripInlineMarkdown(src.slice(start, end));
  return {
    text: src.slice(0, start) + cleaned + src.slice(end),
    cursor: start + cleaned.length,
  };
}

/** Wrap selection as `[text](url)` (or insert a link stub). */
export function applyLink(text: string, from: number, to: number, href = 'https://'): MdEdit {
  const src = normalizeNl(text);
  const a = Math.min(from, to);
  const b = Math.max(from, to);
  const label = a !== b ? src.slice(a, b) : 'link';
  const insert = `[${label}](${href})`;
  return {
    text: src.slice(0, a) + insert + src.slice(b),
    cursor: a + 1 + label.length + 2 + href.length,
  };
}

/** Wrap selection (or current line) in a fenced code block. */
export function applyCodeFence(
  text: string,
  from: number,
  to: number,
  language = 'plaintext'
): MdEdit {
  const src = normalizeNl(text);
  const a = Math.min(from, to);
  const b = Math.max(from, to);
  if (a !== b) {
    const selected = src.slice(a, b);
    const insert = `\`\`\`${language}\n${selected}\n\`\`\`\n`;
    return { text: src.slice(0, a) + insert + src.slice(b), cursor: a + insert.length };
  }
  const { start, end, lines } = lineRange(src, a, b);
  const body = lines.map(stripBlockPrefix).join('\n') || 'code';
  const insert = `\`\`\`${language}\n${body}\n\`\`\``;
  return { text: src.slice(0, start) + insert + src.slice(end), cursor: start + insert.length };
}

/** Insert / wrap mermaid fence at selection. */
export function applyMermaid(text: string, from: number, to: number): MdEdit {
  const src = normalizeNl(text);
  const a = Math.min(from, to);
  const b = Math.max(from, to);
  const body =
    a !== b ? src.slice(a, b).trim() || 'flowchart LR\n  A-->B' : 'flowchart LR\n  A-->B';
  if (a !== b) {
    const insert = `\`\`\`mermaid\n${body}\n\`\`\`\n`;
    return { text: src.slice(0, a) + insert + src.slice(b), cursor: a + insert.length };
  }
  const { start, end } = lineRange(src, a, b);
  const line = stripBlockPrefix(src.slice(start, end));
  const insert =
    line.length === 0
      ? `\`\`\`mermaid\n${body}\n\`\`\``
      : `\`\`\`mermaid\n${body}\n\`\`\`\n\n${line}`;
  return { text: src.slice(0, start) + insert + src.slice(end), cursor: start + insert.length };
}

/** Wrap selection / line in :::kind callout, or change kind when already inside one. */
export function applyCallout(
  text: string,
  from: number,
  to: number,
  kind: string,
  title: string,
  changeKindAt: (text: string, pos: number, kind: string) => MdEdit | null
): MdEdit {
  const src = normalizeNl(text);
  const pos = Math.min(from, to);
  const changed = changeKindAt(src, pos, kind);
  if (changed) {
    return changed;
  }
  const a = Math.min(from, to);
  const b = Math.max(from, to);
  const inner =
    a !== b
      ? src.slice(a, b)
      : stripBlockPrefix(lineRange(src, a, b).lines.join('\n')) || 'Your message here.';
  const block = `:::${kind} ${title}\n${inner}\n:::\n`;
  if (a !== b) {
    return { text: src.slice(0, a) + block + src.slice(b), cursor: a + block.length };
  }
  const { start, end } = lineRange(src, a, b);
  return { text: src.slice(0, start) + block + src.slice(end), cursor: start + block.length };
}
