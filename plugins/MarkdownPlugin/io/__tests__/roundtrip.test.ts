import { describe, expect, it } from 'vitest';
import { docToMarkdown, markdownToDoc } from '@ocm/wysiwyg/io/markdown';
import { emptyEditorDoc, isMarkdownEditorDoc, projectPreviewHtml, serializeDoc } from '../index';

describe('Markdown callout / mermaid round-trip', () => {
  it(':::callout + @btn ↔ callout node', () => {
    const md = `:::info Tip
Hello **world**.

@btn[Go](https://example.com)
:::
`;
    const doc = markdownToDoc(md);
    expect(isMarkdownEditorDoc(doc)).toBe(true);
    const callout = doc.content?.[0];
    expect(callout?.type).toBe('callout');
    expect(callout?.attrs?.variant).toBe('info');
    expect(callout?.attrs?.title).toBe('Tip');
    expect(callout?.attrs?.actions).toStrictEqual([{ label: 'Go', href: 'https://example.com' }]);
    const back = docToMarkdown(doc);
    expect(back).toContain(':::info Tip');
    expect(back).toContain('@btn[Go](https://example.com)');
    expect(back).toContain(':::');
  });

  it('```mermaid ↔ mermaid atom', () => {
    const md = '```mermaid\nflowchart LR\n  A-->B\n```\n';
    const doc = markdownToDoc(md);
    expect(doc.content?.[0]?.type).toBe('mermaid');
    expect(String(doc.content?.[0]?.attrs?.source)).toContain('flowchart LR');
    expect(docToMarkdown(doc)).toContain('```mermaid');
    expect(serializeDoc(doc)).toContain('A-->B');
  });

  it('projectPreviewHtml projects callout + mermaid without re-parse artifacts', () => {
    const doc = emptyEditorDoc(`:::warn Caution
Body

@btn[Ok](#)
:::

\`\`\`mermaid
flowchart TB
  X-->Y
\`\`\`
`);
    const html = projectPreviewHtml(doc);
    expect(html).toContain('data-node="callout"');
    expect(html).toContain('data-variant="warn"');
    expect(html).toContain('ocm-md-callout__btn');
    expect(html).toContain('data-node="mermaid"');
    expect(html).not.toContain('OCMMERMAIDPLACEHOLDER');
  });
});
