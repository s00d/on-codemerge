import { describe, expect, it } from 'vitest';
import { mountTrustedSvg, parseSafeSvg, sanitizeHTML } from '../safeHtml';

describe('safeHtml', () => {
  it('sanitizeHTML strips script and on* handlers', () => {
    const clean = sanitizeHTML('<p onclick="x">ok</p><script>bad</script>');
    expect(clean).toContain('ok');
    expect(clean).not.toContain('<script');
    expect(clean).not.toMatch(/onclick/i);
  });

  it('sanitizeHTML keeps strike <s> and unwraps unknown tags', () => {
    expect(sanitizeHTML('<p><em><s>right</s></em></p>')).toContain('<s>right</s>');
    expect(sanitizeHTML('<p><foo>kept</foo></p>')).toContain('kept');
    expect(sanitizeHTML('<p><foo>kept</foo></p>')).not.toContain('<foo');
  });

  it('parseSafeSvg keeps foreignObject labels', () => {
    const svg = parseSafeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><span>Label</span></div></foreignObject></svg>'
    );
    expect(svg?.textContent).toContain('Label');
  });

  it('parseSafeSvg sanitizes foreignObject HTML (no iframe/srcdoc/object/formaction)', () => {
    const svg = parseSafeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="80" height="40">' +
        '<div xmlns="http://www.w3.org/1999/xhtml">' +
        '<iframe srcdoc="evil"></iframe>' +
        '<object data="https://evil.example/"></object>' +
        '<button formaction="javascript:alert(1)">go</button>' +
        '<span>Label</span>' +
        '</div></foreignObject></svg>'
    );
    expect(svg).toBeInstanceOf(SVGElement);
    expect(svg?.querySelector('iframe')).toBeNull();
    expect(svg?.querySelector('object')).toBeNull();
    expect(svg?.querySelector('button')).toBeNull();
    expect(svg?.innerHTML.toLowerCase()).not.toContain('srcdoc');
    expect(svg?.innerHTML.toLowerCase()).not.toContain('formaction');
    expect(svg?.textContent).toContain('Label');
  });

  it('parseSafeSvg drops javascript href', () => {
    const svg = parseSafeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>x</text></a></svg>'
    );
    expect(svg?.querySelector('a')?.getAttribute('href')).toBeNull();
  });

  it('parseSafeSvg keeps marker sizing attrs and pattern (case-insensitive)', () => {
    const svg = parseSafeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
        '<defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">' +
        '<path d="M0,0 L0,6 L8,3 z"/></marker>' +
        '<pattern id="p" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0h1"/></pattern>' +
        '</defs></svg>'
    );
    const marker = svg?.querySelector('marker');
    expect(marker?.getAttribute('markerWidth')).toBe('8');
    expect(marker?.getAttribute('refX')).toBe('6');
    expect(marker?.getAttribute('orient')).toBe('auto');
    expect(svg?.querySelector('pattern')).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 10 10');
  });

  it('mountTrustedSvg imports svg root without sanitize walk', () => {
    const el = mountTrustedSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" data-ocm-mermaid="1"><rect width="1" height="1"/></svg>'
    );
    expect(el).toBeInstanceOf(SVGElement);
    expect(el?.getAttribute('data-ocm-mermaid')).toBe('1');
    expect(el?.querySelector('rect')).toBeTruthy();
    expect(mountTrustedSvg('<div>nope</div>')).toBeNull();
  });
});
