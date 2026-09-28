import { describe, expect, it } from 'vitest';
import { parseSafeSvg, sanitizeHTML } from '../safeHtml';

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

  it('parseSafeSvg drops javascript href', () => {
    const svg = parseSafeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>x</text></a></svg>'
    );
    expect(svg?.querySelector('a')?.getAttribute('href')).toBeNull();
  });
});
