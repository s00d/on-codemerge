/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { Editor } from '../Editor';
import { insertText } from '@on-codemerge/kernel';
import { createCorePlugins, createDefaultPlugins } from '../../plugins';
import { docToHTML, htmlToDoc } from '../../io/html';
import type { DocNode } from '@on-codemerge/kernel';

function mountEditor(): { host: HTMLDivElement; editor: Editor } {
  const host = document.createElement('div');
  document.body.append(host);
  const editor = new Editor(host, { plugins: createCorePlugins() });
  return { host, editor };
}

function teardown(host: HTMLDivElement, editor: Editor): void {
  editor.destroy();
  host.remove();
}

/** Large HTML: many blocks, marks, lists, table, link, unicode. */
function buildLargeHtml(paragraphs: number): string {
  const parts: string[] = [
    '<h1>Load HTML fixture</h1>',
    '<h2>Секция с юникодом — café 日本語</h2>',
    '<p>Intro with <strong>bold</strong>, <em>italic</em>, <u>under</u>, <s>strike</s>, and <a href="https://example.com/x">link</a>.</p>',
    '<ul><li>Bullet one</li><li>Bullet <strong>two</strong></li><li>Третий пункт</li></ul>',
    '<ol><li>First</li><li>Second</li></ol>',
    '<blockquote><p>Quoted line with <em>emphasis</em>.</p></blockquote>',
    '<pre><code class="language-ts">const n = 42;\nconsole.log(n);\n</code></pre>',
    '<table><tbody><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr><tr><td>三</td><td>四</td></tr></tbody></table>',
    '<hr />',
  ];
  for (let i = 0; i < paragraphs; i++) {
    parts.push(
      `<p>Paragraph ${i}: lorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
        `Marker <strong>#${i}</strong> and trailing text.</p>`
    );
  }
  return parts.join('\n');
}

/** Large Markdown: headings, lists, code fence, table-ish lines, unicode. */
function buildLargeMarkdown(paragraphs: number): string {
  const lines: string[] = [
    '# Load Markdown fixture',
    '',
    '## Секция с юникодом — café 日本語',
    '',
    'Intro with **bold**, *italic*, and a [link](https://example.com/x).',
    '',
    '- Bullet one',
    '- Bullet **two**',
    '- Третий пункт',
    '',
    '1. First',
    '2. Second',
    '',
    '> Quoted line with *emphasis*.',
    '',
    '```ts',
    'const n = 42;',
    'console.log(n);',
    '```',
    '',
    '---',
    '',
  ];
  for (let i = 0; i < paragraphs; i++) {
    lines.push(
      `Paragraph ${i}: lorem ipsum dolor sit amet. Marker **#${i}** and trailing text.`,
      ''
    );
  }
  return lines.join('\n');
}

function plainFingerprint(htmlOrMd: string): string {
  return htmlOrMd.replace(/\s+/g, ' ').trim();
}

describe('Editor HTML / Markdown load (large & varied)', () => {
  it('setHTML loads a large mixed document and preserves key content on getHTML', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    const html = buildLargeHtml(80);
    editor.setHTML(html);

    const out = editor.getHTML();
    expect(out).toContain('Load HTML fixture');
    expect(out).toContain('café');
    expect(out).toContain('日本語');
    expect(out).toContain('https://example.com/x');
    expect(out).toContain('Bullet one');
    expect(out).toContain('Paragraph 0:');
    expect(out).toContain('Paragraph 79:');
    expect(out).toContain('#42');
    expect(out.toLowerCase()).toMatch(/<(strong|b)>/);
    expect(out.toLowerCase()).toMatch(/<(ul|ol)>/);
    expect(out.toLowerCase()).toContain('<table');

    const json = editor.getJSON();
    expect(json.doc.type).toBe('doc');
    expect((json.doc.content?.length ?? 0) > 20).toBe(true);

    teardown(host, editor);
  });

  it('HTML double round-trip stays stable (set → get → set → get)', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    const html = buildLargeHtml(40);
    editor.setHTML(html);
    const once = editor.getHTML();
    editor.setHTML(once);
    const twice = editor.getHTML();
    // Second pass should not collapse or wipe content.
    expect(twice).toContain('Load HTML fixture');
    expect(twice).toContain('Paragraph 39:');
    expect(plainFingerprint(twice).length).toBeGreaterThan(500);
    // Structure fingerprint: same headings count order
    expect((twice.match(/<h1\b/gi) ?? []).length).toBe((once.match(/<h1\b/gi) ?? []).length);
    expect((twice.match(/<p\b/gi) ?? []).length).toBeGreaterThanOrEqual(
      Math.min((once.match(/<p\b/gi) ?? []).length, 30)
    );
    teardown(host, editor);
  });

  it('setMarkdown loads a large mixed document and preserves key content on getMarkdown', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    const md = buildLargeMarkdown(80);
    editor.setMarkdown(md);

    const out = editor.getMarkdown();
    expect(out).toContain('Load Markdown fixture');
    expect(out).toContain('café');
    expect(out).toContain('日本語');
    expect(out).toContain('https://example.com/x');
    expect(out).toMatch(/\*\*bold\*\*|\*\*#0\*\*/);
    expect(out).toContain('Paragraph 0:');
    expect(out).toContain('Paragraph 79:');
    expect(out).toMatch(/^# /m);
    expect(out).toMatch(/```/);

    const json = editor.getJSON();
    expect(json.doc.content?.[0]?.type).toBe('heading');
    expect((json.doc.content?.length ?? 0) > 20).toBe(true);

    teardown(host, editor);
  });

  it('Markdown double round-trip stays stable', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    const md = buildLargeMarkdown(40);
    editor.setMarkdown(md);
    const once = editor.getMarkdown();
    editor.setMarkdown(once);
    const twice = editor.getMarkdown();
    expect(twice).toContain('Load Markdown fixture');
    expect(twice).toContain('Paragraph 39:');
    expect(twice.length).toBeGreaterThan(400);
    teardown(host, editor);
  });

  it('switching HTML → Markdown → HTML does not empty the doc', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    editor.setHTML(
      '<h2>Cross format</h2><p>Hello <strong>world</strong> and café.</p><ul><li>A</li><li>B</li></ul>'
    );
    const md = editor.getMarkdown();
    expect(md.length).toBeGreaterThan(10);
    editor.setMarkdown(md);
    const html = editor.getHTML();
    expect(html).toContain('Cross format');
    expect(html).toMatch(/world|Hello/);
    expect(html.length).toBeGreaterThan(20);
    teardown(host, editor);
  });

  it('empty / whitespace / script-ish HTML does not throw and leaves a usable editor', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    expect(() => editor.setHTML('')).not.toThrow();
    expect(() => editor.setHTML('   ')).not.toThrow();
    expect(() => editor.setHTML('<p>ok</p><script>alert(1)</script>')).not.toThrow();
    expect(editor.getHTML()).not.toContain('<script');
    editor.run(insertText('alive'));
    expect(editor.getHTML()).toContain('alive');
    teardown(host, editor);
  });

  it('empty / weird Markdown does not throw and editor stays editable', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    expect(() => editor.setMarkdown('')).not.toThrow();
    expect(() => editor.setMarkdown('\n\n\n')).not.toThrow();
    expect(() => editor.setMarkdown('plain line only')).not.toThrow();
    editor.run(insertText('md-ok'));
    expect(editor.getMarkdown()).toContain('md-ok');
    teardown(host, editor);
  });

  it('docChanged fires on setHTML and setMarkdown; extract APIs return strings', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    let hits = 0;
    editor.on('docChanged', () => {
      hits += 1;
    });
    editor.setHTML('<p>from-html</p>');
    editor.setMarkdown('## from-md');
    expect(hits).toBeGreaterThanOrEqual(2);
    expect(typeof editor.getHTML()).toBe('string');
    expect(typeof editor.getMarkdown()).toBe('string');
    expect(editor.getHTML()).toContain('from-md');
    teardown(host, editor);
  });

  it('very large HTML (~200 paragraphs) loads without throwing', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    const html = buildLargeHtml(200);
    expect(html.length).toBeGreaterThan(10_000);
    expect(() => editor.setHTML(html)).not.toThrow();
    expect(editor.getHTML()).toContain('Paragraph 199:');
    expect(editor.getJSON().doc.content!.length).toBeGreaterThan(100);
    teardown(host, editor);
  });

  it('very large Markdown (~200 paragraphs) loads without throwing', () => {
    expect.hasAssertions();
    const { host, editor } = mountEditor();
    const md = buildLargeMarkdown(200);
    expect(md.length).toBeGreaterThan(5_000);
    expect(() => editor.setMarkdown(md)).not.toThrow();
    expect(editor.getMarkdown()).toContain('Paragraph 199:');
    teardown(host, editor);
  });
});

/** Every structural / mark / atom element the HTML IO layer supports. */
const ALL_ATOM_TYPES = [
  'math',
  'chart',
  'image',
  'video',
  'youtube',
  'pdf',
  'calendar',
  'timer',
  'form',
  'file',
  'template',
  'block_container',
  'footnote_list',
] as const;

function collectTypes(node: DocNode, into: Set<string>): void {
  into.add(node.type);
  for (const child of node.content ?? []) {
    collectTypes(child, into);
  }
}

function collectMarkTypes(node: DocNode, into: Set<string>): void {
  for (const m of node.marks ?? []) {
    into.add(m.type);
  }
  for (const child of node.content ?? []) {
    collectMarkTypes(child, into);
  }
}

function buildKitchenSinkHtml(): string {
  const headings = [1, 2, 3, 4, 5, 6].map((l) => `<h${l}>Heading ${l}</h${l}>`).join('');
  const atoms = ALL_ATOM_TYPES.map((t) => {
    if (t === 'math') {
      return `<div data-node="math" data-expression="x^2" data-width="200" data-height="80"></div>`;
    }
    if (t === 'chart') {
      return `<div data-node="chart" data-chart-type="bar" data-title="T" data-width="320" data-height="180"></div>`;
    }
    if (t === 'image') {
      return `<img src="https://example.com/a.png" alt="pic" width="120" height="80" data-align="center" />`;
    }
    return `<div data-node="${t}" data-id="id-${t}" data-sample="1"></div>`;
  }).join('');

  return [
    headings,
    '<p>Plain paragraph.</p>',
    '<p><strong>bold</strong> <b>b</b> <em>italic</em> <i>i</i> <u>under</u> <s>strike</s> <strike>strike2</strike></p>',
    '<p><a href="https://example.com/doc" title="t" target="_blank" rel="noopener">link</a></p>',
    '<p><span style="color:#ff0000">red</span> <span style="background-color:#ffff00">hi</span></p>',
    '<p><span style="font-family:serif;font-size:14px">font</span> <code>inline-code</code></p>',
    '<p><mark data-comment="c1" title="note">commented</mark> <span class="ocm-mention" data-mention-id="u1">@user</span> <sup class="ocm-footnote" data-footnote="f1">1</sup></p>',
    '<p><span class="tracked-insert" data-mark="insertion">ins</span> <span class="tracked-delete" data-mark="deletion">del</span> <span class="misspelled-word" data-mark="misspelled">mis</span></p>',
    '<ul><li>ul-a</li><li>ul-<strong>b</strong></li></ul>',
    '<ol><li>ol-1</li><li>ol-2</li></ol>',
    '<blockquote><p>quote body</p></blockquote>',
    '<pre data-language="ts"><code>const x = 1;</code></pre>',
    '<table data-has-header="true" data-responsive="true"><tbody><tr data-header="true"><th>H1</th><th>H2</th></tr><tr><td colspan="1">c1</td><td>c2</td></tr></tbody></table>',
    '<hr />',
    '<p>line<br/>break</p>',
    atoms,
  ].join('\n');
}

function buildKitchenSinkDoc(): DocNode {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'H1' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'H2' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'H3' }] },
      { type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: 'H4' }] },
      { type: 'heading', attrs: { level: 5 }, content: [{ type: 'text', text: 'H5' }] },
      { type: 'heading', attrs: { level: 6 }, content: [{ type: 'text', text: 'H6' }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'under', marks: [{ type: 'underline' }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'strike', marks: [{ type: 'strike' }] },
          { type: 'text', text: ' ' },
          {
            type: 'text',
            text: 'link',
            marks: [{ type: 'link', attrs: { href: 'https://example.com/x' } }],
          },
          { type: 'text', text: ' ' },
          {
            type: 'text',
            text: 'red',
            marks: [{ type: 'textColor', attrs: { color: '#ff0000' } }],
          },
          { type: 'text', text: ' ' },
          {
            type: 'text',
            text: 'hi',
            marks: [{ type: 'highlight', attrs: { color: '#ffff00' } }],
          },
          { type: 'text', text: ' ' },
          {
            type: 'text',
            text: 'font',
            marks: [
              { type: 'fontFamily', attrs: { family: 'serif' } },
              { type: 'fontSize', attrs: { size: '14px' } },
            ],
          },
          { type: 'text', text: ' ' },
          {
            type: 'text',
            text: 'cmt',
            marks: [{ type: 'comment', attrs: { id: 'c1', text: 'n' } }],
          },
          { type: 'text', text: ' ' },
          { type: 'text', text: '@u', marks: [{ type: 'mention', attrs: { id: 'u1' } }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: '1', marks: [{ type: 'footnote', attrs: { id: 'f1' } }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'ins', marks: [{ type: 'insertion' }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'del', marks: [{ type: 'deletion' }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'mis', marks: [{ type: 'misspelled' }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: 'code', marks: [{ type: 'code' }] },
        ],
      },
      {
        type: 'bulletList',
        content: [{ type: 'listItem', content: [{ type: 'text', text: 'ul' }] }],
      },
      {
        type: 'orderedList',
        content: [{ type: 'listItem', content: [{ type: 'text', text: 'ol' }] }],
      },
      {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'q' }] }],
      },
      { type: 'code_block', attrs: { language: 'js', code: 'const a = 1;' } },
      {
        type: 'table',
        attrs: { cols: 2, hasHeader: true },
        content: [
          {
            type: 'tableRow',
            attrs: { header: true },
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H2' }] }],
              },
            ],
          },
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }],
              },
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
              },
            ],
          },
        ],
      },
      { type: 'horizontalRule', attrs: {} },
      {
        type: 'image',
        attrs: { src: 'https://example.com/a.png', alt: 'pic', width: 100, height: 50 },
      },
      ...ALL_ATOM_TYPES.filter((t) => t !== 'image').map(
        (t) =>
          ({
            type: t,
            attrs: { id: `id-${t}`, sample: true },
          }) as DocNode
      ),
    ],
  };
}

describe('HTML covers all existing elements', () => {
  it('imports every structural HTML tag, mark, and known data-node atom', () => {
    expect.hasAssertions();
    const doc = htmlToDoc(buildKitchenSinkHtml());
    const types = new Set<string>();
    const marks = new Set<string>();
    collectTypes(doc, types);
    collectMarkTypes(doc, marks);

    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(
        doc.content?.some((n) => n.type === 'heading' && Number(n.attrs?.level) === level)
      ).toBe(true);
    }
    expect(types.has('paragraph')).toBe(true);
    expect(types.has('bulletList')).toBe(true);
    expect(types.has('orderedList')).toBe(true);
    expect(types.has('listItem')).toBe(true);
    expect(types.has('blockquote')).toBe(true);
    expect(types.has('code_block')).toBe(true);
    expect(types.has('table')).toBe(true);
    expect(types.has('tableRow')).toBe(true);
    expect(types.has('tableCell')).toBe(true);
    expect(types.has('horizontalRule')).toBe(true);
    expect(types.has('image')).toBe(true);
    for (const atom of ALL_ATOM_TYPES) {
      expect(types.has(atom)).toBe(true);
    }

    for (const m of [
      'bold',
      'italic',
      'underline',
      'strike',
      'link',
      'textColor',
      'highlight',
      'fontFamily',
      'fontSize',
      'comment',
      'mention',
      'footnote',
      'insertion',
      'deletion',
      'misspelled',
      'code',
    ]) {
      expect(marks.has(m)).toBe(true);
    }
  });

  it('round-trips kitchen-sink doc through docToHTML → htmlToDoc for all nodes/marks', () => {
    expect.hasAssertions();
    const original = buildKitchenSinkDoc();
    const html = docToHTML(original);
    expect(html).toContain('<h1>');
    expect(html).toContain('<h6>');
    expect(html).toContain('<hr');
    expect(html).toContain('<img');
    expect(html).toContain('data-node="chart"');
    expect(html).toContain('data-node="math"');
    expect(html).toContain('href="https://example.com/x"');

    const back = htmlToDoc(html);
    const types = new Set<string>();
    const marks = new Set<string>();
    collectTypes(back, types);
    collectMarkTypes(back, marks);

    expect(types.has('heading')).toBe(true);
    expect(types.has('paragraph')).toBe(true);
    expect(types.has('bulletList')).toBe(true);
    expect(types.has('orderedList')).toBe(true);
    expect(types.has('blockquote')).toBe(true);
    expect(types.has('code_block')).toBe(true);
    expect(types.has('table')).toBe(true);
    expect(types.has('horizontalRule')).toBe(true);
    expect(types.has('image')).toBe(true);
    for (const atom of ALL_ATOM_TYPES) {
      expect(types.has(atom)).toBe(true);
    }
    for (const m of [
      'bold',
      'italic',
      'underline',
      'strike',
      'link',
      'textColor',
      'highlight',
      'fontFamily',
      'fontSize',
      'comment',
      'mention',
      'footnote',
      'insertion',
      'deletion',
      'misspelled',
      'code',
    ]) {
      expect(marks.has(m)).toBe(true);
    }
  });

  it('Editor.setHTML kitchen-sink keeps all element kinds loadable', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: createDefaultPlugins() });
    expect(() => editor.setHTML(buildKitchenSinkHtml())).not.toThrow();
    const out = editor.getHTML();
    expect(out).toContain('Heading 1');
    expect(out).toContain('Heading 6');
    expect(out).toContain('https://example.com/doc');
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol>');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<table');
    expect(out).toContain('<hr');
    expect(out).toMatch(/<img\b/);
    expect(out).toContain('data-node="chart"');
    expect(out).toContain('data-node="math"');
    expect(out).toContain('data-node="timer"');
    expect(out).toContain('data-node="calendar"');
    expect(out).toContain('data-node="form"');
    expect(out).toContain('data-node="video"');
    expect(out).toContain('data-node="youtube"');
    expect(out).toContain('data-node="pdf"');
    expect(out).toContain('data-node="file"');

    const types = new Set<string>();
    collectTypes(editor.getJSON().doc, types);
    expect(types.has('horizontalRule')).toBe(true);
    expect(types.has('image')).toBe(true);
    expect(types.has('blockquote')).toBe(true);

    editor.destroy();
    host.remove();
  });
});
