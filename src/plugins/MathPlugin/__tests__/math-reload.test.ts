import { describe, expect, it } from 'vitest';
import { parseMath } from '../utils/parse';
import { astToMathML } from '../utils/mathml';
import { MathRenderer } from '../services/MathRenderer';
import { docToHTML, htmlToDoc } from '../../../io/html';

const CASES: { name: string; expr: string; expectTag?: string }[] = [
  { name: 'frac', expr: String.raw`\frac{a}{b}`, expectTag: 'mfrac' },
  { name: 'pow', expr: 'x^2 + y^2', expectTag: 'msup' },
  { name: 'sqrt', expr: String.raw`\sqrt{x+1}`, expectTag: 'msqrt' },
  { name: 'nroot', expr: String.raw`\sqrt[3]{8}`, expectTag: 'mroot' },
  { name: 'sum', expr: String.raw`\sum_{i=1}^{n} i`, expectTag: 'munderover' },
  { name: 'int', expr: String.raw`\int_{a}^{b} f(x)\,dx`, expectTag: 'munderover' },
  { name: 'lim', expr: String.raw`\lim_{x \to 0} \frac{\sin x}{x}`, expectTag: 'mfrac' },
  { name: 'parens', expr: String.raw`\left(\frac{1}{2}\right)`, expectTag: 'mfrac' },
  { name: 'greek', expr: String.raw`\alpha + \beta = \gamma` },
  {
    name: 'quadratic',
    expr: String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
    expectTag: 'mfrac',
  },
  {
    name: 'basel',
    expr: String.raw`\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}`,
    expectTag: 'munderover',
  },
  {
    name: 'gauss',
    expr: String.raw`\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}`,
    expectTag: 'munderover',
  },
];

describe('math formulas smoke + reload', () => {
  const renderer = new MathRenderer();

  it.each(CASES)('$name parses, renders, embeds, reloads', ({ expr, expectTag }) => {
    expect.hasAssertions();
    const parsed = parseMath(expr);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const mml = astToMathML(parsed.ast);
    expect(mml.tagName.toLowerCase()).toBe('math');
    if (expectTag) {
      expect(mml.querySelector(expectTag)).toBeTruthy();
    }

    const el = renderer.renderMath(expr, { width: 480, height: 160 });
    expect(el.classList.contains('ocm-math-content')).toBe(true);
    expect(el.classList.contains('ocm-math-error')).toBe(false);

    const html = docToHTML({
      type: 'doc',
      content: [
        {
          type: 'math',
          attrs: { expression: expr, align: 'center', width: 500, height: 180 },
        },
      ],
    });
    expect(html).toContain('data-node="math"');
    expect(html.toLowerCase()).toContain('<math');

    const back = htmlToDoc(html);
    const atom = back.content?.[0];
    expect(atom?.type).toBe('math');
    expect(atom?.attrs?.expression).toBe(expr);
    expect(atom?.attrs?.align).toBe('center');
    expect(atom?.attrs?.width).toBe(500);
    expect(atom?.attrs?.height).toBe(180);

    // Second hop: import → export → import (reload twice)
    const html2 = docToHTML(back);
    const back2 = htmlToDoc(html2);
    expect(back2.content?.[0]?.attrs?.expression).toBe(expr);
  });
});
