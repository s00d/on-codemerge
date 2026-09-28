import { describe, expect, it } from 'vitest';
import { viewToHtml } from '@on-codemerge/sdk';
import { docToPublishedHTML } from '../../../apps/wysiwyg/src/io/html';
import { highlightJsonHtml, renderJsonEmbedPublish } from '../publish/preview';

describe('json_embed publish preview', () => {
  it('highlights keys and strings without CodeMirror classes', () => {
    expect.hasAssertions();
    const html = highlightJsonHtml('{"hello":true}');
    expect(html).toContain('ocm-json-tok-key');
    expect(html).toContain('ocm-json-tok-literal');
    expect(html).not.toContain('cm-editor');
  });

  it('publish ViewSpec is a static card', () => {
    expect.hasAssertions();
    const html = viewToHtml(renderJsonEmbedPublish({ text: '{\n  "a": 1\n}' }));
    expect(html).toContain('ocm-json-publish');
    expect(html).toContain('data-node="json_embed"');
    expect(html).toContain('data-text="{&quot;a&quot;:1}"');
    expect(html).not.toMatch(/data-text="[^"]*\n[^"]*"/);
    expect(html).toContain('ocm-json-tok-key');
    expect(html).not.toContain('cm-editor');
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
    expect(html).toContain('ocm-json-tok-key');
    expect(html).not.toContain('cm-editor');
  });
});
