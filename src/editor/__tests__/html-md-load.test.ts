/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { Editor } from '../Editor';
import { insertText } from '@on-codemerge/kernel';
import { createCorePlugins } from '../../plugins';

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
