import { describe, expect, it } from 'vitest';
import {
  compactMarkdownText,
  docToText,
  emptyEditorDoc,
  expandCompactMarkdownText,
  isMarkdownEditorDoc,
  parseText,
  renderMarkdownPreviewHtml,
  serializeDoc,
} from '../../io';

describe('MarkdownPlugin io adapters', () => {
  it('emptyEditorDoc is markdown SoT', () => {
    const doc = emptyEditorDoc('# hi\n');
    expect(isMarkdownEditorDoc(doc)).toBe(true);
    expect(docToText(doc)).toBe('# hi\n');
    expect(serializeDoc(doc)).toBe('# hi\n');
  });

  it('parseText round-trips; rejects oversized', () => {
    const ok = parseText('hello');
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(docToText(ok.doc)).toBe('hello\n');
    }
    const big = parseText('x'.repeat(1_000_001));
    expect(big.ok).toBe(false);
  });

  it('compact / expand encode newlines for data-text', () => {
    const raw = 'a\nb\n';
    const compact = compactMarkdownText(raw);
    expect(compact.includes('\n')).toBe(false);
    expect(expandCompactMarkdownText(compact)).toBe(raw);
  });

  it('compact / expand round-trips literal backslash-n', () => {
    const raw = 'code uses \\n escape';
    expect(expandCompactMarkdownText(compactMarkdownText(raw))).toBe(raw);
  });

  it('preview emits data-node mermaid host (no SVG in HTML)', () => {
    const md = '# T\n\n```mermaid\nflowchart LR\n  A-->B\n```\n';
    const html = renderMarkdownPreviewHtml(md);
    expect(html).toContain('ocm-md-mermaid');
    expect(html).toContain('data-node="mermaid"');
    expect(html).toContain('data-ocm-mermaid');
    expect(html).toContain('language-mermaid');
    expect(html).toContain('flowchart LR');
    expect(html.toLowerCase()).not.toContain('<svg');
    expect(html).not.toMatch(/\son\w+=/i);
  });

  it('emptyEditorDoc / parseText yield prose SoT (not markdown blob)', () => {
    const doc = emptyEditorDoc(':::info Tip\nHi\n:::\n');
    expect(isMarkdownEditorDoc(doc)).toBe(true);
    expect(doc.content?.[0]?.type).toBe('callout');
    expect(doc.content?.[0]?.attrs?.variant).toBe('info');
  });
});
