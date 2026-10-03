import { describe, expect, it } from 'vitest';
import { render } from '../index';

describe('svg emit', () => {
  it('emits no style block and no CDN fonts', () => {
    const svg = render('flowchart LR\n  A-->B');
    expect(svg).toContain('<svg');
    expect(svg).not.toContain('<style');
    expect(svg).not.toContain('fonts.googleapis');
    expect(svg).not.toContain('var(--');
    expect(svg).toContain('data-ocm-mermaid="1"');
  });

  it('escapes dangerous labels (trusted SVG boundary)', () => {
    const evil = ['java', 'script:', 'alert(1)'].join('');
    const svg = render(
      `flowchart LR\n  A["<img onerror=x><script>alert(1)</script>"]-->B["${evil}"]`
    );
    expect(svg).not.toContain('<img');
    expect(svg).not.toContain('<script');
    expect(svg).toContain('&lt;img');
    expect(svg).toContain('&lt;script');
    expect(svg).toContain(evil); // text only — emitter escapes markup, not URL schemes in text
  });

  it('emits marker attrs for arrows', () => {
    const svg = render('flowchart LR\n  A-->B');
    expect(svg).toMatch(/markerWidth="/);
    expect(svg).toMatch(/refX="/);
    expect(svg).toMatch(/marker-end="/);
  });

  it('applies theme fill hex as presentation attrs', () => {
    const svg = render('flowchart LR\n  A-->B', {
      theme: {
        bg: '#112233',
        fg: '#abcdef',
        surface: '#445566',
        border: '#778899',
        accent: '#99aabb',
      },
    });
    expect(svg).toContain('fill="#112233"');
    expect(svg).toContain('fill="#445566"');
    expect(svg).toContain('stroke="#99aabb"');
  });

  it('renders class members as multiple text lines', () => {
    const svg = render('classDiagram\n  class Animal {\n    +name\n    +eat()\n  }');
    expect(svg).toContain('>Animal<');
    expect(svg).toContain('>name<');
    expect(svg).toContain('>eat()<');
    const texts = svg.match(/<text /g) ?? [];
    expect(texts.length).toBeGreaterThanOrEqual(3);
  });
});
