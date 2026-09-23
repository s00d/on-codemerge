import { describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import { exportHTML, importHTML, exportMarkdown, importMarkdown } from '../index';
import { parseJSON, serializeJSON } from '../json';
import { sanitizeHTML } from '../sanitize';
import { createDoc, createParagraph, createText, docToJSON } from '@on-codemerge/kernel';

describe('io html', () => {
  it('exports and imports paragraph with bold', () => {
    expect.hasAssertions();
    const doc = createDoc([
      createParagraph([createText('Hi', [{ type: 'bold' }]), createText(' there')]),
    ]);
    const html = exportHTML(doc);
    expect(html).toContain('<strong>');
    const back = importHTML(html);
    expect(back.type).toBe('doc');
    expect(back.content![0].type).toBe('paragraph');
  });

  it('wraps insertion, deletion, and misspelled marks', () => {
    expect.hasAssertions();
    const doc = createDoc([
      createParagraph([
        createText('in', [{ type: 'insertion', attrs: { author: 'a' } }]),
        createText('del', [{ type: 'deletion', attrs: { author: 'a' } }]),
        createText('bad', [{ type: 'misspelled' }]),
      ]),
    ]);
    const html = exportHTML(doc);
    expect(html).toContain('tracked-insert');
    expect(html).toContain('tracked-delete');
    expect(html).toContain('misspelled-word');
    expect(html).toContain('data-mark="insertion"');
  });

  it('wraps link color font comment mention footnote marks', () => {
    expect.hasAssertions();
    const doc = createDoc([
      createParagraph([
        createText('L', [
          {
            type: 'link',
            attrs: { href: 'https://x.test', title: 't', target: '_blank', rel: 'noopener' },
          },
        ]),
        createText('C', [{ type: 'textColor', attrs: { color: '#f00' } }]),
        createText('H', [{ type: 'highlight', attrs: { color: '#ff0' } }]),
        createText('F', [{ type: 'fontFamily', attrs: { family: 'serif' } }]),
        createText('S', [{ type: 'fontSize', attrs: { size: '14px' } }]),
        createText('N', [{ type: 'comment', attrs: { id: 'c1', text: 'note' } }]),
        createText('@', [{ type: 'mention', attrs: { id: 'u1' } }]),
        createText('1', [{ type: 'footnote', attrs: { id: 'f1' } }]),
        createText('U', [{ type: 'underline' }]),
        createText('X', [{ type: 'italic' }]),
        createText('K', [{ type: 'strike' }]),
        createText('Z', [{ type: 'customMark' }]),
      ]),
    ]);
    const html = exportHTML(doc);
    expect(html).toContain('href="https://x.test"');
    expect(html).toContain('color:#f00');
    expect(html).toContain('background-color:#ff0');
    expect(html).toContain('font-family:serif');
    expect(html).toContain('font-size:14px');
    expect(html).toContain('data-comment="c1"');
    expect(html).toContain('ocm-mention');
    expect(html).toContain('ocm-footnote');
    expect(html).toContain('<u>');
    expect(html).toContain('<em>');
    expect(html).toContain('<s>');
    expect(html).toContain('data-mark="customMark"');
  });

  it('round-trips heading, list and table', () => {
    expect.hasAssertions();
    const html =
      '<h2>Title</h2><ul><li>A</li></ul><table><tbody><tr><td>C1</td><td>C2</td></tr></tbody></table>';
    const doc = importHTML(html);
    expect(doc.content?.[0]?.type).toBe('heading');
    expect(doc.content?.[1]?.type).toBe('bulletList');
    expect(doc.content?.[2]?.type).toBe('table');
    const out = exportHTML(doc);
    expect(out).toContain('<h2>');
    expect(out).toContain('<ul>');
    expect(out).toContain('html-editor-table');
    expect(out).toContain('not-prose');
    expect(out).toContain('C1');
  });

  it('imports span style color and highlight marks', () => {
    expect.hasAssertions();
    const doc = importHTML(
      '<p><span style="color:#ff0000">R</span><span style="background-color:#ffff00">Y</span></p>'
    );
    const nodes = doc.content![0].content ?? [];
    expect(
      nodes[0]?.marks?.some((m) => m.type === 'textColor' && m.attrs?.color === '#ff0000')
    ).toBe(true);
    expect(
      nodes[1]?.marks?.some((m) => m.type === 'highlight' && m.attrs?.color === '#ffff00')
    ).toBe(true);
  });

  it('imports span font-family and font-size marks', () => {
    expect.hasAssertions();
    const doc = importHTML('<p><span style="font-family:serif;font-size:14px">T</span></p>');
    const node = doc.content![0].content?.[0];
    expect(node?.marks?.some((m) => m.type === 'fontFamily' && m.attrs?.family === 'serif')).toBe(
      true
    );
    expect(node?.marks?.some((m) => m.type === 'fontSize' && m.attrs?.size === '14px')).toBe(true);
  });

  it('round-trips color marks through export/import', () => {
    expect.hasAssertions();
    const doc = createDoc([
      createParagraph([
        createText('C', [{ type: 'textColor', attrs: { color: '#00ff00' } }]),
        createText('H', [{ type: 'highlight', attrs: { color: '#0000ff' } }]),
      ]),
    ]);
    const back = importHTML(exportHTML(doc));
    const nodes = back.content![0].content ?? [];
    expect(
      nodes[0]?.marks?.some((m) => m.type === 'textColor' && m.attrs?.color === '#00ff00')
    ).toBe(true);
    expect(
      nodes[1]?.marks?.some((m) => m.type === 'highlight' && m.attrs?.color === '#0000ff')
    ).toBe(true);
  });

  it('sanitizeHTML strips script tags', () => {
    expect.hasAssertions();
    const clean = sanitizeHTML('<p>ok</p><script>alert(1)</script>');
    expect(clean).not.toContain('<script');
  });
});

describe('io json', () => {
  it('serialize/parse', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('x')])]);
    const raw = serializeJSON(doc);
    const back = parseJSON(raw);
    expect(docToJSON(back)).toStrictEqual(JSON.parse(raw));
  });
});

describe('io markdown', () => {
  it('exports headings, lists, code and marks from JSON', () => {
    expect.hasAssertions();
    const doc = createDoc([
      { type: 'heading', attrs: { level: 2 }, content: [createText('Title')] },
      createParagraph([
        createText('Hello', [{ type: 'bold' }]),
        createText(' '),
        createText('world', [{ type: 'italic' }]),
      ]),
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [createText('one')] },
          { type: 'listItem', content: [createText('two')] },
        ],
      },
      {
        type: 'code_block',
        attrs: { language: 'js', code: 'const x = 1;' },
        content: [],
      },
      {
        type: 'image',
        attrs: { src: 'https://example.com/a.png', alt: 'pic' },
      },
    ]);
    const md = exportMarkdown(doc);
    expect(md).toContain('## Title');
    expect(md).toContain('**Hello**');
    expect(md).toContain('*world*');
    expect(md).toContain('- one');
    expect(md).toContain('```js');
    expect(md).toContain('const x = 1;');
    expect(md).toContain('![pic](https://example.com/a.png)');
  });

  it('imports markdown into JSON doc nodes', () => {
    expect.hasAssertions();
    const md = `# Hello

Paragraph with **bold** and *italic*.

- a
- b

\`\`\`ts
type X = 1;
\`\`\`

![alt](https://cdn.example/x.png)
`;
    const doc = importMarkdown(md);
    expect(doc.type).toBe('doc');
    expect(doc.content?.[0]?.type).toBe('heading');
    expect(doc.content?.[0]?.attrs?.level).toBe(1);
    expect(doc.content?.[1]?.type).toBe('paragraph');
    expect(doc.content?.[2]?.type).toBe('bulletList');
    expect(doc.content?.[3]?.type).toBe('code_block');
    expect(doc.content?.[3]?.attrs?.language).toBe('ts');
    expect(doc.content?.[3]?.attrs?.code).toContain('type X');
    expect(doc.content?.[4]?.type).toBe('image');
    expect(doc.content?.[4]?.attrs?.src).toContain('cdn.example');
  });

  it('round-trips markdown through JSON model', () => {
    expect.hasAssertions();
    const md = '## Title\n\nHello **world**\n\n1. one\n2. two\n';
    const doc = importMarkdown(md);
    const again = exportMarkdown(doc);
    expect(again).toContain('## Title');
    expect(again).toContain('**world**');
    expect(again).toMatch(/1\. one/);
    expect(again).toMatch(/2\. two/);
  });
});
