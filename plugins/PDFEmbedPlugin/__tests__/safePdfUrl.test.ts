import { describe, expect, it } from 'vitest';
import { safePdfUrl } from '../index';

describe('PDFEmbed safePdfUrl', () => {
  it('keeps http(s) / relative / pdf data, drops script-capable schemes', () => {
    expect.hasAssertions();
    expect(safePdfUrl('https://x.test/a.pdf')).toBe('https://x.test/a.pdf');
    expect(safePdfUrl('/files/a.pdf')).toBe('/files/a.pdf');
    expect(safePdfUrl('data:application/pdf;base64,AA')).toBe('data:application/pdf;base64,AA');
    // eslint-disable-next-line no-script-url -- rejection fixture
    expect(safePdfUrl('javascript:alert(1)')).toBe('');
    expect(safePdfUrl(' java\tscript:alert(1)')).toBe('');
    expect(safePdfUrl('data:text/html,<script>1</script>')).toBe('');
  });
});
