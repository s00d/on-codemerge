import { describe, expect, it } from 'vitest';
import { viewToHtml } from '@codemerge/sdk';
import { compactMarkdownText } from '../io/preview';
import { renderMdEmbedPublish } from '../publish/preview';

describe('md_embed publish preview', () => {
  it('emits compact data-text without newlines and sanitized body', () => {
    const md = '# Hi\n\n```mermaid\nflowchart LR\n  A-->B\n```\n';
    const spec = renderMdEmbedPublish({ text: md });
    const html = viewToHtml(spec);
    expect(html).toContain('data-node="md_embed"');
    expect(html).toContain('data-text=');
    // JSON compact is attr-escaped (`"` → `&quot;`); must not contain raw newlines.
    expect(html).toMatch(/data-text="[^"]*"/);
    expect(html).not.toMatch(/data-text="[^"]*\n[^"]*"/);
    expect(compactMarkdownText(md).startsWith('"')).toBe(true);
    expect(html).toContain('data-ocm-runtime="md-mermaid"');
    expect(html).toContain('ocm-md-mermaid');
    expect(html).toContain('language-mermaid');
    expect(html).toContain('flowchart LR');
    expect(html.toLowerCase()).not.toContain('<svg');
  });
});
