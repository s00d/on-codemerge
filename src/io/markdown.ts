import type { DocNode, Mark } from '@on-codemerge/kernel';
import { createDoc, createParagraph, createText } from '@on-codemerge/kernel';
import { asAttr } from '../utils/asAttr';

/** Serialize document JSON tree to CommonMark/GFM-ish Markdown. */
export function docToMarkdown(doc: DocNode): string {
  const blocks = doc.type === 'doc' ? (doc.content ?? []) : [doc];
  return `${blocks
    .map(blockToMarkdown)
    .join('')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()}\n`;
}

export function exportMarkdown(doc: DocNode): string {
  return docToMarkdown(doc);
}

/** Parse Markdown into the editor document model (JSON DocNode tree). */
export function markdownToDoc(md: string): DocNode {
  const lines = md.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const content: DocNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code block
    const fence = /^(`{3,}|~{3,})(\w*)\s*$/.exec(line);
    if (fence) {
      const marker = fence[1];
      const language = fence[2] || 'plaintext';
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? '').startsWith(marker[0].repeat(marker.length))) {
        body.push(lines[i] ?? '');
        i += 1;
      }
      if (i < lines.length) {
        i += 1;
      }
      content.push({
        type: 'code_block',
        attrs: { language, code: body.join('\n') },
        content: [],
      });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      content.push({ type: 'horizontalRule', attrs: {}, content: [] });
      i += 1;
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: parseInline(heading[2] ?? ''),
      });
      i += 1;
      continue;
    }

    // Blockquote (consecutive)
    if (line.startsWith('>')) {
      const quoted: string[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('>')) {
        quoted.push((lines[i] ?? '').replace(/^>\s?/, ''));
        i += 1;
      }
      const inner = markdownToDoc(quoted.join('\n'));
      content.push({
        type: 'blockquote',
        content:
          inner.content && inner.content.length > 0
            ? inner.content
            : [createParagraph(parseInline(quoted.join(' ')))],
      });
      continue;
    }

    // GFM table
    if (isTableStart(lines, i)) {
      const { node, next } = parseTable(lines, i);
      content.push(node);
      i = next;
      continue;
    }

    // Lists
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const { node, next } = parseList(lines, i);
      content.push(node);
      i = next;
      continue;
    }

    // Paragraph (consume until blank / next block)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i] ?? '';
      if (!cur.trim()) {
        break;
      }
      if (/^(#{1,6})\s+/.test(cur)) {
        break;
      }
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(cur.trim())) {
        break;
      }
      if (cur.startsWith('>')) {
        break;
      }
      if (/^(`{3,}|~{3,})/.test(cur)) {
        break;
      }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(cur)) {
        break;
      }
      if (isTableStart(lines, i)) {
        break;
      }
      paraLines.push(cur);
      i += 1;
    }
    const inlines = parseInline(paraLines.join(' '));
    if (inlines.length === 1 && inlines[0].type === 'image') {
      content.push(inlines[0]);
    } else {
      content.push(createParagraph(inlines));
    }
  }

  if (content.length === 0) {
    content.push(createParagraph([createText('')]));
  }
  return createDoc(content);
}

export function importMarkdown(md: string): DocNode {
  return markdownToDoc(md);
}

function blockToMarkdown(node: DocNode): string {
  switch (node.type) {
    case 'paragraph': {
      return `${inlinesToMarkdown(node.content ?? [])}\n\n`;
    }
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1)));
      return `${'#'.repeat(level)} ${inlinesToMarkdown(node.content ?? [])}\n\n`;
    }
    case 'blockquote': {
      const inner = (node.content ?? []).map(blockToMarkdown).join('').trimEnd();
      return `${inner
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n')}\n\n`;
    }
    case 'bulletList': {
      return `${(node.content ?? []).map((li) => `- ${listItemText(li)}`).join('\n')}\n\n`;
    }
    case 'orderedList': {
      return `${(node.content ?? []).map((li, idx) => `${idx + 1}. ${listItemText(li)}`).join('\n')}\n\n`;
    }
    case 'horizontalRule': {
      return '---\n\n';
    }
    case 'code_block':
    case 'codeBlock': {
      const lang = asAttr(node.attrs?.language);
      const code =
        typeof node.attrs?.code === 'string'
          ? node.attrs.code
          : (node.content ?? []).map((c) => c.text ?? '').join('');
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }
    case 'image': {
      const alt = escapeMd(asAttr(node.attrs?.alt));
      const src = asAttr(node.attrs?.src);
      return `![${alt}](${src})\n\n`;
    }
    case 'table': {
      return tableToMarkdown(node);
    }
    case 'text': {
      return inlinesToMarkdown([node]);
    }
    default: {
      // Unknown / rich atoms: emit a stable HTML data stub so round-trip via MD keeps type.
      if (node.attrs && Object.keys(node.attrs).length > 0) {
        const attrs = Object.entries(node.attrs)
          .map(([k, v]) => `${k}="${escapeAttr(asAttr(v))}"`)
          .join(' ');
        return `<!-- ocm:${node.type} ${attrs} -->\n\n`;
      }
      if ((node.content?.length ?? 0) > 0) {
        return (node.content ?? []).map(blockToMarkdown).join('');
      }
      return '';
    }
  }
}

function listItemText(li: DocNode): string {
  const parts = li.content ?? [];
  if (parts.length === 0) {
    return '';
  }
  if (parts.every((p) => p.type === 'text')) {
    return inlinesToMarkdown(parts);
  }
  return parts
    .map((p) => {
      if (p.type === 'text') {
        return inlineToMarkdown(p);
      }
      if (p.type === 'paragraph') {
        return inlinesToMarkdown(p.content ?? []);
      }
      return blockToMarkdown(p).trim();
    })
    .join(' ');
}

function inlinesToMarkdown(nodes: DocNode[]): string {
  return nodes.map(inlineToMarkdown).join('');
}

function inlineToMarkdown(node: DocNode): string {
  if (node.type === 'image') {
    const alt = escapeMd(asAttr(node.attrs?.alt));
    const src = asAttr(node.attrs?.src);
    return `![${alt}](${src})`;
  }
  if (node.type !== 'text') {
    return inlinesToMarkdown(node.content ?? []);
  }
  let text = escapeMd(node.text ?? '');
  const marks = node.marks ?? [];
  const link = marks.find((m) => m.type === 'link');
  if (marks.some((m) => m.type === 'code')) {
    text = `\`${node.text ?? ''}\``;
  }
  if (marks.some((m) => m.type === 'bold')) {
    text = `**${text}**`;
  }
  if (marks.some((m) => m.type === 'italic')) {
    text = `*${text}*`;
  }
  if (marks.some((m) => m.type === 'strike')) {
    text = `~~${text}~~`;
  }
  if (marks.some((m) => m.type === 'underline')) {
    text = `<u>${text}</u>`;
  }
  if (link) {
    const raw = asAttr(link.attrs?.href).trim();
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw)?.[1]?.toLowerCase();
    const safe =
      raw && (!scheme || scheme === 'http' || scheme === 'https' || scheme === 'mailto') ? raw : '';
    text = safe ? `[${text}](${safe})` : text;
  }
  return text;
}

function escapeMd(text: string): string {
  return text.replaceAll(/([\\`*_[\]])/g, String.raw`\$1`);
}

function escapeAttr(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function cellsOf(row: DocNode): string[] {
  return (row.content ?? []).map((cell) => {
    const paras = cell.content ?? [];
    const text = paras
      .map((p) => inlinesToMarkdown(p.type === 'paragraph' ? (p.content ?? []) : [p]))
      .join(' ')
      .replaceAll('|', String.raw`\|`)
      .trim();
    return text || ' ';
  });
}

function tableToMarkdown(table: DocNode): string {
  const rows = table.content ?? [];
  if (rows.length === 0) {
    return '';
  }
  const header = cellsOf(rows[0]);
  const width = Math.max(header.length, ...rows.map((r) => (r.content ?? []).length), 1);
  const pad = (cells: string[]) => {
    const out = [...cells];
    while (out.length < width) {
      out.push(' ');
    }
    return out.slice(0, width);
  };
  const lines = [
    `| ${pad(header).join(' | ')} |`,
    `| ${pad(header)
      .map(() => '---')
      .join(' | ')} |`,
  ];
  for (let r = 1; r < rows.length; r++) {
    lines.push(`| ${pad(cellsOf(rows[r])).join(' | ')} |`);
  }
  return `${lines.join('\n')}\n\n`;
}

function isTableStart(lines: string[], i: number): boolean {
  const a = lines[i] ?? '';
  const b = lines[i + 1] ?? '';
  return /^\s*\|/.test(a) && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(b);
}

function parseMdRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) {
    s = s.slice(1);
  }
  if (s.endsWith('|')) {
    s = s.slice(0, -1);
  }
  return s.split('|').map((c) => c.trim());
}

function mdTextToTableCell(text: string): DocNode {
  return {
    type: 'tableCell',
    content: [createParagraph(parseInline(text))],
  };
}

function mdCellsToTableRow(cells: string[]): DocNode {
  return {
    type: 'tableRow',
    content: cells.map(mdTextToTableCell),
  };
}

function parseTable(lines: string[], start: number): { node: DocNode; next: number } {
  const header = parseMdRow(lines[start] ?? '');
  let i = start + 2;
  const body: string[][] = [];
  while (i < lines.length && /^\s*\|/.test(lines[i] ?? '')) {
    body.push(parseMdRow(lines[i] ?? ''));
    i += 1;
  }
  return {
    node: {
      type: 'table',
      attrs: { cols: header.length },
      content: [mdCellsToTableRow(header), ...body.map(mdCellsToTableRow)],
    },
    next: i,
  };
}

function parseList(lines: string[], start: number): { node: DocNode; next: number } {
  const first = lines[start] ?? '';
  const ordered = /^\s*\d+[.)]\s+/.test(first);
  const items: DocNode[] = [];
  let i = start;
  const itemRe = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;

  while (i < lines.length) {
    const m = (lines[i] ?? '').match(itemRe);
    if (!m) {
      break;
    }
    items.push({
      type: 'listItem',
      content: parseInline(m[1] ?? ''),
    });
    i += 1;
  }

  return {
    node: {
      type: ordered ? 'orderedList' : 'bulletList',
      content: items.length > 0 ? items : [{ type: 'listItem', content: [createText('')] }],
    },
    next: i,
  };
}

/** Inline Markdown → text nodes with marks. */
function parseInline(input: string): DocNode[] {
  const out: DocNode[] = [];
  let i = 0;
  const push = (text: string, marks: Mark[] = []) => {
    if (!text) {
      return;
    }
    out.push(createText(text, marks));
  };

  while (i < input.length) {
    // Image ![alt](src)
    if (input[i] === '!' && input[i + 1] === '[') {
      const close = input.indexOf(']', i + 2);
      const paren = close === -1 ? -1 : input.indexOf('(', close);
      const end = paren >= 0 ? input.indexOf(')', paren) : -1;
      if (close > i && paren === close + 1 && end > paren) {
        out.push({
          type: 'image',
          attrs: {
            alt: unescapeMd(input.slice(i + 2, close)),
            src: input.slice(paren + 1, end),
          },
        });
        i = end + 1;
        continue;
      }
    }

    // Link [text](href)
    if (input[i] === '[') {
      const close = input.indexOf(']', i + 1);
      const paren = close === -1 ? -1 : input.indexOf('(', close);
      const end = paren >= 0 ? input.indexOf(')', paren) : -1;
      if (close > i && paren === close + 1 && end > paren) {
        const label = input.slice(i + 1, close);
        const href = input.slice(paren + 1, end);
        const inner = parseInline(label).map((n) => ({
          ...n,
          marks: [...(n.marks ?? []), { type: 'link', attrs: { href } }],
        }));
        out.push(...inner);
        i = end + 1;
        continue;
      }
    }

    // Bold ** or __
    if ((input.startsWith('**', i) || input.startsWith('__', i)) && input.length > i + 2) {
      const marker = input.slice(i, i + 2);
      const end = input.indexOf(marker, i + 2);
      if (end > i) {
        for (const n of parseInline(input.slice(i + 2, end))) {
          out.push({
            ...n,
            marks: [...(n.marks ?? []), { type: 'bold' }],
          });
        }
        i = end + 2;
        continue;
      }
    }

    // Italic * or _
    if ((input[i] === '*' || input[i] === '_') && input[i + 1] !== input[i]) {
      const marker = input[i];
      const end = input.indexOf(marker, i + 1);
      if (end > i) {
        for (const n of parseInline(input.slice(i + 1, end))) {
          out.push({
            ...n,
            marks: [...(n.marks ?? []), { type: 'italic' }],
          });
        }
        i = end + 1;
        continue;
      }
    }

    // Strike ~~
    if (input.startsWith('~~', i)) {
      const end = input.indexOf('~~', i + 2);
      if (end > i) {
        for (const n of parseInline(input.slice(i + 2, end))) {
          out.push({
            ...n,
            marks: [...(n.marks ?? []), { type: 'strike' }],
          });
        }
        i = end + 2;
        continue;
      }
    }

    // Inline code
    if (input[i] === '`') {
      const end = input.indexOf('`', i + 1);
      if (end > i) {
        push(input.slice(i + 1, end), [{ type: 'code' }]);
        i = end + 1;
        continue;
      }
    }

    // HTML underline
    if (input.startsWith('<u>', i)) {
      const end = input.indexOf('</u>', i + 3);
      if (end > i) {
        for (const n of parseInline(input.slice(i + 3, end))) {
          out.push({
            ...n,
            marks: [...(n.marks ?? []), { type: 'underline' }],
          });
        }
        i = end + 4;
        continue;
      }
    }

    // Escaped char
    if (input[i] === '\\' && i + 1 < input.length) {
      push(input[i + 1]);
      i += 2;
      continue;
    }

    // Plain run until special
    let j = i + 1;
    while (j < input.length && !'*_`~[<\\!'.includes(input[j])) {
      j += 1;
    }
    push(unescapeMd(input.slice(i, j)));
    i = j;
  }

  if (out.length === 0) {
    out.push(createText(''));
  }
  return out;
}

function unescapeMd(text: string): string {
  return text.replaceAll(/\\([\\`*_[\]])/g, '$1');
}
