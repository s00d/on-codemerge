import { describe, expect, it } from 'vitest';
import { docToHTML, htmlToDoc } from '../html';

describe('html atom round-trip', () => {
  it('round-trips chart attrs via kebab data-* (typed data array)', () => {
    expect.hasAssertions();
    const series = [{ name: 'S', data: [{ label: 'A', value: 1 }] }];
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'chart',
          attrs: {
            chartType: 'bar',
            data: series,
            title: 'T',
            width: 400,
            height: 200,
            showLegend: true,
            showGrid: false,
          },
        },
      ],
    });
    expect(html).toContain('data-node="chart"');
    expect(html).toContain('data-chart-type="bar"');
    expect(html).toContain('data-show-grid="false"');
    expect(html).toContain('data-data=');
    const doc = htmlToDoc(html);
    const chart = doc.content?.[0];
    expect(chart?.type).toBe('chart');
    expect(chart?.attrs).toMatchObject({
      chartType: 'bar',
      title: 'T',
      width: 400,
      height: 200,
      showLegend: true,
      showGrid: false,
    });
    expect(Array.isArray(chart?.attrs?.data)).toBe(true);
    expect(chart?.attrs?.data).toStrictEqual(series);
  });

  it('imports legacy chart data JSON string into typed array', () => {
    expect.hasAssertions();
    const doc = htmlToDoc(
      '<div data-node="chart" data-chart-type="bar" data-data="[{&quot;name&quot;:&quot;S&quot;,&quot;data&quot;:[{&quot;label&quot;:&quot;A&quot;,&quot;value&quot;:1}]}]"></div>'
    );
    expect(Array.isArray(doc.content?.[0]?.attrs?.data)).toBe(true);
  });

  it('round-trips form schema / calendar payload / block tree as objects', () => {
    expect.hasAssertions();
    const schema = {
      id: 'f1',
      action: '/x',
      method: 'POST',
      fields: [{ id: 'n', type: 'text', label: 'Name', required: false }],
    };
    const payload = {
      calendar: { id: 'c1', title: 'Cal', description: '', events: [] },
      events: [],
    };
    const tree = { kind: 'leaf' };
    const html = docToHTML({
      type: 'doc',
      content: [
        { type: 'form', attrs: { schema, action: '/x', align: '' } },
        { type: 'calendar', attrs: { title: 'Cal', calendarId: 'c1', payload, align: '' } },
        { type: 'block_container', attrs: { layout: 'stack', tree, width: 0, height: 0 } },
      ],
    });
    expect(html).toContain('data-schema=');
    expect(html).toContain('data-payload=');
    expect(html).toContain('data-tree=');
    const doc = htmlToDoc(html);
    expect(doc.content?.[0]?.attrs?.schema).toStrictEqual(schema);
    expect(doc.content?.[1]?.attrs?.payload).toStrictEqual(payload);
    expect(doc.content?.[2]?.attrs?.tree).toStrictEqual(tree);
  });

  it('round-trips footnote items, timer payload, and style map as objects', () => {
    expect.hasAssertions();
    const items = [
      { id: 'fn_1', note: 'First' },
      { id: 'fn_2', note: 'Second' },
    ];
    const style = { color: '#111', 'font-size': '16px' };
    const timerPayload = { id: 't1', title: 'Timer', targetDate: '2030-01-01T00:00:00.000Z' };
    const html = docToHTML({
      type: 'doc',
      content: [
        { type: 'footnote_list', attrs: { items } },
        {
          type: 'paragraph',
          attrs: { style, align: 'center' },
          content: [{ type: 'text', text: 'Hi' }],
        },
        { type: 'timer', attrs: { payload: timerPayload, title: 'Timer', align: '' } },
      ],
    });
    expect(html).toContain('data-items=');
    expect(html).toContain('<p ');
    expect(html).toContain('data-style=');
    expect(html).toContain('data-align="center"');
    expect(html).toContain('data-payload=');
    const doc = htmlToDoc(html);
    expect(doc.content?.[0]?.attrs?.items).toStrictEqual(items);
    expect(doc.content?.[1]?.type).toBe('paragraph');
    expect(doc.content?.[1]?.attrs?.style).toStrictEqual(style);
    expect(doc.content?.[1]?.attrs?.align).toBe('center');
    expect(doc.content?.[2]?.attrs?.payload).toStrictEqual(timerPayload);
  });

  it('round-trips prose block attrs (heading / list / blockquote)', () => {
    expect.hasAssertions();
    const style = { color: '#0284c7' };
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, align: 'right', style },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'bulletList',
          attrs: { align: 'left' },
          content: [
            {
              type: 'listItem',
              attrs: { style },
              content: [{ type: 'text', text: 'A' }],
            },
          ],
        },
        {
          type: 'blockquote',
          attrs: { align: 'center' },
          content: [
            {
              type: 'paragraph',
              attrs: { lineHeight: '1.6' },
              content: [{ type: 'text', text: 'Q' }],
            },
          ],
        },
      ],
    });
    expect(html).toContain('<h2 ');
    expect(html).toContain('data-align="right"');
    expect(html).toContain('data-style=');
    expect(html).not.toContain('data-level=');
    expect(html).toContain('<ul ');
    expect(html).toContain('<li ');
    expect(html).toContain('<blockquote ');
    const doc = htmlToDoc(html);
    expect(doc.content?.[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 2, align: 'right', style },
    });
    expect(doc.content?.[1]?.type).toBe('bulletList');
    expect(doc.content?.[1]?.attrs?.align).toBe('left');
    expect(doc.content?.[1]?.content?.[0]?.attrs?.style).toStrictEqual(style);
    expect(doc.content?.[2]?.attrs?.align).toBe('center');
    expect(doc.content?.[2]?.content?.[0]?.attrs?.lineHeight).toBe('1.6');
  });

  it('exports math atom with MathML payload', () => {
    expect.hasAssertions();
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'math',
          attrs: { expression: String.raw`\frac{a}{b}`, align: '', width: 400, height: 120 },
        },
      ],
    });
    expect(html).toContain('data-node="math"');
    expect(html).toContain('data-expression=');
    expect(html).toContain('<math');
    expect(html).toContain('mfrac');
    const doc = htmlToDoc(html);
    expect(doc.content?.[0]?.type).toBe('math');
    expect(doc.content?.[0]?.attrs?.expression).toContain('frac');
  });

  it('imports pre/code as code_block', () => {
    expect.hasAssertions();
    const doc = htmlToDoc('<pre data-language="ts"><code>const x = 1</code></pre>');
    expect(doc.content?.[0]).toMatchObject({
      type: 'code_block',
      attrs: { language: 'ts', code: 'const x = 1' },
    });
  });

  it('exports json_embed with body JSON plus data-text', () => {
    expect.hasAssertions();
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'json_embed',
          attrs: { text: '{\n  "hello": true,\n  "n": 1\n}\n' },
        },
      ],
    });
    expect(html).toContain('data-node="json_embed"');
    // data-text is compact (single line); body is pretty-printed.
    expect(html).toMatch(/data-text="\{&quot;hello&quot;:true,&quot;n&quot;:1\}"/);
    expect(html).not.toMatch(/data-text="[^"]*\n[^"]*"/);
    expect(html).toContain('<pre><code class="language-json">');
    expect(html).toContain('&quot;hello&quot;: true');
    const doc = htmlToDoc(html);
    expect(doc.content?.[0]?.type).toBe('json_embed');
    expect(String(doc.content?.[0]?.attrs?.text)).toContain('"hello"');
  });

  it('imports json_embed from body when data-text missing', () => {
    expect.hasAssertions();
    const doc = htmlToDoc(
      '<div data-node="json_embed"><pre><code class="language-json">{"a":1}</code></pre></div>'
    );
    expect(doc.content?.[0]).toMatchObject({
      type: 'json_embed',
      attrs: { text: '{"a":1}' },
    });
  });

  it('imports HTML tables as tableGrid and round-trips used cells', () => {
    expect.hasAssertions();
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'tableGrid',
          attrs: {
            version: 2,
            columns: [
              { id: 'name', title: 'Name', width: 160 },
              { id: 'qty', title: 'Qty', width: 96 },
            ],
            rows: [
              { id: 'r1', cells: { name: 'Apples', qty: 3 } },
              { id: 'r2', cells: { name: 'Oranges', qty: 2 } },
            ],
          },
        },
      ],
    });
    expect(html).toContain('html-editor-table--sheet');
    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('Apples');
    const doc = htmlToDoc(html);
    const table = doc.content?.[0];
    expect(table?.type).toBe('tableGrid');
    const cols = table?.attrs?.columns as { title: string }[] | undefined;
    expect(cols?.map((c) => c.title)).toStrictEqual(['Name', 'Qty']);
  });

  it('strips javascript/data link hrefs on export', () => {
    expect.hasAssertions();
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [
                {
                  type: 'link',
                  attrs: { href: ['java', 'script:', 'alert(1)'].join('') },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(html).not.toContain(['java', 'script:'].join(''));
    expect(html).toContain('<a href=""');
  });

  it('imports mermaid + callout projector HTML into SoT bodies', () => {
    expect.hasAssertions();
    const html = `
<aside class="ocm-md-callout ocm-md-callout--info" data-node="callout" data-variant="info">
  <div class="ocm-md-callout__title">Tip</div>
  <div class="ocm-md-callout__body"><p>Hello</p></div>
  <div class="ocm-md-callout__actions"><a class="ocm-md-callout__btn" href="#">Go</a></div>
</aside>
<div class="ocm-md-mermaid" data-node="mermaid" data-ocm-mermaid="1"><pre><code class="language-mermaid">flowchart LR
  A--&gt;B</code></pre></div>`;
    const doc = htmlToDoc(html);
    const callout = doc.content?.find((n) => n.type === 'callout');
    const mermaid = doc.content?.find((n) => n.type === 'mermaid');
    expect(callout?.attrs?.variant).toBe('info');
    expect(callout?.attrs?.title).toBe('Tip');
    expect(callout?.content?.[0]?.type).toBe('paragraph');
    expect(callout?.attrs?.actions).toStrictEqual([{ label: 'Go', href: '#' }]);
    const mermaidSource = typeof mermaid?.attrs?.source === 'string' ? mermaid.attrs.source : '';
    expect(mermaidSource).toContain('flowchart LR');
    expect(mermaidSource).toContain('A-->B');
  });
});
