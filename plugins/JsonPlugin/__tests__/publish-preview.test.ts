/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { viewToHtml } from '@codemerge/sdk';
import { highlightHtml, lex } from '@codemerge/editor';
import { docToPublishedHTML } from '../../../apps/wysiwyg/src/io/html';
import { prettyJsonText, renderJsonEmbedPublish } from '../publish/preview';

describe('json_embed publish preview', () => {
  it('highlights structural tokens for JSON text', () => {
    expect.hasAssertions();
    const pretty = prettyJsonText('{"hello":true}');
    const src = highlightHtml(pretty);
    const tokens = lex(pretty);
    expect(tokens.some((t) => t.type === 'string')).toBe(true);
    expect(tokens.some((t) => t.type === 'boolean')).toBe(true);
    expect(src.includes('hello')).toBe(true);
  });

  it('publish ViewSpec is a static card with data attrs', () => {
    expect.hasAssertions();
    const html = viewToHtml(renderJsonEmbedPublish({ text: '{\n  "a": 1\n}' }));
    expect(html).toContain('ocm-json-publish');
    expect(html).toContain('data-node="json_embed"');
    expect(html).toContain('data-text="{&quot;a&quot;:1}"');
    expect(html).not.toMatch(/data-text="[^"]*\n[^"]*"/);
  });

  it('docToPublishedHTML uses publish.render for json_embed', () => {
    expect.hasAssertions();
    const publishers = new Map([
      [
        'json_embed',
        {
          node: 'json_embed',
          render: (attrs: Record<string, unknown>) => renderJsonEmbedPublish(attrs),
        },
      ],
    ]);
    const html = docToPublishedHTML(
      {
        type: 'doc',
        content: [{ type: 'json_embed', attrs: { text: '{"hello":true}' } }],
      },
      publishers
    );
    expect(html).toContain('ocm-json-publish');
    expect(html).toContain('hello');
  });
});
