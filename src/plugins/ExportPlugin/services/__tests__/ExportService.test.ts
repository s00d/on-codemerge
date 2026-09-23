import { describe, expect, it } from 'vitest';
import { PUBLISHED_CONTENT_CLASS } from '@on-codemerge/sdk';
import { ExportService } from '../ExportService';

describe('exportService', () => {
  it('wraps HTML in PUBLISHED_CONTENT_CLASS and links public.css', () => {
    expect.hasAssertions();
    const svc = new ExportService();
    const html = svc.formatHTML('<p>Hi</p>');
    expect(html).toContain(`class="${PUBLISHED_CONTENT_CLASS}"`);
    expect(html).toContain('dist/public.css');
    expect(html).toContain('<p>Hi</p>');
    expect(html).not.toContain('public.js');
  });

  it('links public.js when fragment declares a runtime', () => {
    expect.hasAssertions();
    const svc = new ExportService();
    const html = svc.formatHTML('<div data-ocm-runtime="timer"></div>');
    expect(html).toContain('dist/public.js');
  });
});
