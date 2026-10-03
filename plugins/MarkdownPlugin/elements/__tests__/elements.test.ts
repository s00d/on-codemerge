import { describe, expect, it } from 'vitest';
import { changeCalloutKindAt, findCalloutAt } from '../calloutEdit';
import { createMdElementRegistry } from '../registry';
import { emptyEditorDoc } from '../../io/adapters';
import { renderMarkdownPreviewHtml } from '../../io/preview';
import { escapeHtml } from '../../io/escape';
import type { MdCustomElement } from '../types';

describe('Markdown custom elements', () => {
  const registry = createMdElementRegistry();

  it('markdownToDoc yields callout + actions for ::: fences', () => {
    const doc = emptyEditorDoc(
      `:::info Hello\nBody **x**.\n\n@btn[Go](https://example.com)\n@btn[Skip](data:text/plain,x)\n:::\n`
    );
    const callout = doc.content?.[0];
    expect(callout?.type).toBe('callout');
    expect(callout?.attrs?.variant).toBe('info');
    expect(callout?.attrs?.title).toBe('Hello');
    expect(callout?.attrs?.actions).toStrictEqual([
      { label: 'Go', href: 'https://example.com' },
      { label: 'Skip', href: 'data:text/plain,x' },
    ]);
  });

  it('preview renders callout + safe buttons only', () => {
    const md = `:::error Boom\nFailed.\n\n@btn[Retry](#)\n@btn[X](data:text/plain,x)\n@btn[Bad](//evil.example)\n:::\n`;
    const html = renderMarkdownPreviewHtml(md, { elements: registry });
    expect(html).toContain('ocm-md-callout--error');
    expect(html).toContain('Boom');
    expect(html).toContain('Retry');
    expect(html).toContain('href="#"');
    expect(html).not.toContain('data:text/plain');
    expect(html).not.toContain('//evil.example');
  });

  it('changeCalloutKindAt swaps opening fence', () => {
    const md = ':::info T\nHi\n:::\n';
    const pos = md.indexOf('Hi');
    expect(findCalloutAt(md, pos)?.kind).toBe('info');
    const next = changeCalloutKindAt(md, pos, 'warn', new Set(registry.ids()));
    expect(next?.text).toContain(':::warn');
  });

  it('allows custom element override via registry', () => {
    const custom: MdCustomElement = {
      id: 'tip',
      label: 'Tip',
      toPreviewHtml: (block, bodyHtml) =>
        `<aside data-ocm-callout="tip"><strong>${escapeHtml(block.title)}</strong>${bodyHtml}</aside>`,
    };
    const reg = createMdElementRegistry([custom]);
    const html = renderMarkdownPreviewHtml(':::tip Note\nHello\n:::\n', { elements: reg });
    expect(html).toContain('data-ocm-callout="tip"');
    expect(html).toContain('Note');
  });
});
