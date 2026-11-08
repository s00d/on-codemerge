import type { DocNode, Mark } from '@codemerge/kernel';
import { createDoc, createParagraph, createText } from '@codemerge/kernel';
import {
  attrsFromGrid,
  gridToMarkdown,
  isGfmTableStart,
  normalizeTableGrid,
  parseGfmTable,
} from '@ocm/table-plugin';
import { asAttr, parseJson } from '@codemerge/sdk';
import { allowedLinkHref, calloutActions } from './html';
import type { CalloutAction } from './html';

/** Serialize document JSON tree to CommonMark/GFM-ish Markdown. */
export function docToMarkdown(doc: DocNode): string {
  const blocks = doc.type === 'doc' ? (doc.content ?? []) : [doc];
  return `${blocks
    .map(blockToMarkdown)
    .join('')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()}\n`;
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

    // Rich-atom stub written by blockToMarkdown: <!-- ocm:type {json} -->
    const stub = parseAtomStub(line.trim());
    if (stub) {
      content.push(stub);
      i += 1;
      continue;
    }

    // Custom callout container: :::info Title … :::
    const calloutOpen = /^:::([a-z][a-z0-9_-]*)(?:\s+(.*))?$/i.exec(line.trimEnd());
    if (calloutOpen) {
      const variant = (calloutOpen[1] ?? 'info').toLowerCase();
      const title = (calloutOpen[2] ?? '').trim();
      const bodyLines: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith(':::')) {
        bodyLines.push(lines[i] ?? '');
        i += 1;
      }
      if (i < lines.length && (lines[i] ?? '').trim() === ':::') {
        i += 1;
      }
      const { bodyMd, actions } = splitCalloutButtons(bodyLines);
      const inner = markdownToDoc(bodyMd);
      content.push({
        type: 'callout',
        attrs: {
          variant,
          title,
          actions,
        },
        content:
          inner.content && inner.content.length > 0
            ? inner.content
            : [createParagraph([createText('')])],
      });
      continue;
    }

    // Fenced code block (mermaid → dedicated atom)
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
      if (language.toLowerCase() === 'mermaid') {
        content.push({
          type: 'mermaid',
          attrs: { source: body.join('\n') },
          content: [],
        });
      } else {
        content.push({
          type: 'code_block',
          attrs: { language, code: body.join('\n') },
          content: [],
        });
      }
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
    if (isGfmTableStart(lines, i)) {
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
      if (/^:::[a-z]/i.test(cur.trim()) || parseAtomStub(cur.trim())) {
        break;
      }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(cur)) {
        break;
      }
      if (isGfmTableStart(lines, i)) {
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

function blockToMarkdown(node: DocNode): string {
  switch (node.type) {
    case 'paragraph': {
      return `${inlinesToMarkdown(node.content ?? [])}\n\n`;
    }
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1));
      return `${'#'.repeat(level)} ${inlinesToMarkdown(node.content ?? [])}\n\n`;
    }
    case 'blockquote': {
      const inner = (node.content ?? []).map(blockToMarkdown).join('').trimEnd();
      return `${inner
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n')}\n\n`;
    }
    case 'bulletList':
    case 'orderedList': {
      return `${listToMarkdown(node)}\n\n`;
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
    case 'mermaid': {
      const source =
        typeof node.attrs?.source === 'string'
          ? node.attrs.source
          : (node.content ?? []).map((c) => c.text ?? '').join('');
      return `\`\`\`mermaid\n${source}\n\`\`\`\n\n`;
    }
    case 'callout': {
      const variant = asAttr(node.attrs?.variant, 'info') || 'info';
      const title = asAttr(node.attrs?.title);
      const open = title ? `:::${variant} ${title}` : `:::${variant}`;
      const inner = (node.content ?? []).map(blockToMarkdown).join('').trimEnd();
      const actions = calloutActions(node.attrs?.actions);
      const btnLines = actions.map((a) => `@btn[${a.label}](${a.href})`).join('\n');
      const body = [inner, btnLines].filter(Boolean).join('\n\n');
      return `${open}\n${body}\n:::\n\n`;
    }
    case 'image': {
      const alt = escapeMd(asAttr(node.attrs?.alt));
      const src = asAttr(node.attrs?.src);
      return `![${alt}](${src})\n\n`;
    }
    case 'table': {
      return tableToMarkdown(node);
    }
    case 'tableGrid': {
      return gridDocToMarkdown(node);
    }
    case 'text': {
      return inlinesToMarkdown([node]);
    }
    default: {
      // Unknown / rich atoms: HTML comment stub; markdownToDoc restores type/attrs/content.
      if (node.attrs && Object.keys(node.attrs).length > 0) {
        const payload = JSON.stringify(
          (node.content?.length ?? 0) > 0
            ? { attrs: node.attrs, content: node.content }
            : { attrs: node.attrs }
        );
        // `--` only occurs inside JSON strings; escaping it keeps `-->` out of the comment.
        return `<!-- ocm:${node.type} ${payload.replaceAll('--', '-\\u002d')} -->\n\n`;
      }
      if ((node.content?.length ?? 0) > 0) {
        return (node.content ?? []).map(blockToMarkdown).join('');
      }
      return '';
    }
  }
}

const isListType = (type: string) => type === 'bulletList' || type === 'orderedList';

/** List → lines; nested lists are indented under their item by the marker width. */
function listToMarkdown(list: DocNode): string {
  return (list.content ?? [])
    .map((li, idx) => {
      const marker = list.type === 'orderedList' ? `${idx + 1}. ` : '- ';
      const parts = li.content ?? [];
      const nested = parts
        .filter((p) => isListType(p.type))
        .map((sub) => listToMarkdown(sub).replaceAll(/^/gm, ' '.repeat(marker.length)));
      const head = listItemText({ ...li, content: parts.filter((p) => !isListType(p.type)) });
      return [`${marker}${head}`, ...nested].join('\n');
    })
    .join('\n');
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
    const safe = allowedLinkHref(asAttr(link.attrs?.href));
    text = safe ? `[${text}](${safe})` : text;
  }
  return text;
}

function escapeMd(text: string): string {
  return text.replaceAll(/([\\`*_[\]])/g, String.raw`\$1`);
}

function isNodeList(v: unknown): v is DocNode[] {
  return (
    Array.isArray(v) &&
    v.every(
      (n) => n !== null && typeof n === 'object' && typeof Reflect.get(n, 'type') === 'string'
    )
  );
}

const ATOM_STUB_RE = /^<!-- ocm:([A-Za-z_][\w-]*) (.*) -->$/;

/** Inverse of the `<!-- ocm:type … -->` stub; also reads the legacy `k="v"` form. */
function parseAtomStub(line: string): DocNode | null {
  const m = ATOM_STUB_RE.exec(line);
  if (!m) {
    return null;
  }
  const [, type, body] = m;
  if (body.startsWith('{')) {
    try {
      const parsed: unknown = parseJson(body);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const attrs: unknown = Reflect.get(parsed, 'attrs');
      const content: unknown = Reflect.get(parsed, 'content');
      if (attrs === null || typeof attrs !== 'object' || Array.isArray(attrs)) {
        return null;
      }
      return {
        type,
        attrs: { ...attrs },
        ...(isNodeList(content) ? { content } : {}),
      };
    } catch {
      return null;
    }
  }
  const attrs: Record<string, unknown> = {};
  for (const [, k, v] of body.matchAll(/([\w-]+)="([^"]*)"/g)) {
    attrs[k] = v.replaceAll('&lt;', '<').replaceAll('&quot;', '"').replaceAll('&amp;', '&');
  }
  return Object.keys(attrs).length > 0 ? { type, attrs } : null;
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

function gridDocToMarkdown(node: DocNode): string {
  return `${gridToMarkdown(
    normalizeTableGrid({
      version: node.attrs?.version,
      columns: node.attrs?.columns,
      rows: node.attrs?.rows,
      view: node.attrs?.view,
      theme: node.attrs?.theme,
      source: node.attrs?.source,
    })
  ).trimEnd()}\n\n`;
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

function parseTable(lines: string[], start: number): { node: DocNode; next: number } {
  const parsed = parseGfmTable(lines, start);
  if (!parsed) {
    return {
      node: { type: 'tableGrid', attrs: attrsFromGrid(normalizeTableGrid({})) },
      next: start + 1,
    };
  }
  return {
    node: {
      type: 'tableGrid',
      attrs: attrsFromGrid(parsed.grid),
    },
    next: parsed.next,
  };
}

const LIST_ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

/** Parse a list at `start`; deeper-indented items become a nested list inside the previous item. */
function parseList(lines: string[], start: number): { node: DocNode; next: number } {
  const first = LIST_ITEM_RE.exec(lines[start] ?? '');
  const baseIndent = first?.[1].length ?? 0;
  const ordered = /\d/.test(first?.[2] ?? '');
  const items: DocNode[] = [];
  let i = start;

  while (i < lines.length) {
    const m = LIST_ITEM_RE.exec(lines[i] ?? '');
    if (!m || m[1].length < baseIndent) {
      break;
    }
    const last = items.at(-1);
    if (m[1].length > baseIndent && last) {
      const sub = parseList(lines, i);
      const content = last.content ?? [];
      // Block form: [paragraph, nested list…] (flat inline item → wrap in a paragraph first).
      last.content =
        content.length > 0 && content.every((c) => c.type === 'text')
          ? [createParagraph(content), sub.node]
          : [...content, sub.node];
      i = sub.next;
      continue;
    }
    if (/\d/.test(m[2]) !== ordered) {
      break;
    }
    items.push({
      type: 'listItem',
      content: parseInline(m[3] ?? ''),
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

const CALLOUT_BTN_RE = /^@btn\[([^\]]*)\]\(([^)]*)\)\s*$/;

function splitCalloutButtons(lines: string[]): { bodyMd: string; actions: CalloutAction[] } {
  const bodyLines: string[] = [];
  const actions: CalloutAction[] = [];
  for (const line of lines) {
    const m = CALLOUT_BTN_RE.exec(line.trim());
    if (!m) {
      bodyLines.push(line);
      continue;
    }
    const label = (m[1] ?? '').trim();
    const href = (m[2] ?? '').trim();
    if (label) {
      actions.push({ label, href: allowedLinkHref(href) });
    }
  }
  return {
    bodyMd: bodyLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, ''),
    actions,
  };
}
