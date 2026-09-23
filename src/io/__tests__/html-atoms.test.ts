import { describe, expect, it } from 'vitest';
import { docToHTML, htmlToDoc } from '../html';

describe('html atom round-trip', () => {
  it('round-trips chart attrs via kebab data-*', () => {
    expect.hasAssertions();
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'chart',
          attrs: {
            chartType: 'bar',
            data: '[{"name":"S","data":[{"label":"A","value":1}]}]',
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

  it('round-trips table header th and spans', () => {
    expect.hasAssertions();
    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'table',
          id: 'table_t1',
          attrs: { cols: 2, hasHeader: true, responsive: true },
          content: [
            {
              type: 'tableRow',
              attrs: { header: true },
              content: [
                {
                  type: 'tableCell',
                  attrs: { colspan: 2 },
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H' }] }],
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
      ],
    });
    expect(html).toContain('<th');
    expect(html).toContain('colspan="2"');
    expect(html).toContain('data-has-header="true"');
    expect(html).toContain('data-responsive="true"');
    const doc = htmlToDoc(html);
    const table = doc.content?.[0];
    expect(table?.type).toBe('table');
    expect(table?.attrs).toMatchObject({ hasHeader: true, responsive: true, cols: 2 });
    expect(table?.id).toBe('table_t1');
    expect(table?.content?.[0]?.content?.[0]?.attrs).toMatchObject({ colspan: 2 });
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
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    });
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<a href=""');
  });
});
