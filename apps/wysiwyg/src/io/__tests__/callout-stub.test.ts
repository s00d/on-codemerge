import { describe, expect, it } from 'vitest';
import type { DocNode } from '@codemerge/kernel';
import { htmlToDoc } from '../html';
import { docToMarkdown, markdownToDoc } from '../markdown';

describe('callout action hrefs', () => {
  it('htmlToDoc drops javascript: hrefs from DOM buttons and data-actions', () => {
    expect.hasAssertions();
    const dom = htmlToDoc(
      `<aside data-node="callout" data-variant="info"><div class="ocm-md-callout__body"><p>x</p></div>
<div class="ocm-md-callout__actions"><a href="javascript:alert(1)">Bad</a><a href="https://ok.test">Ok</a></div></aside>`
    );
    expect(dom.content?.[0]?.attrs?.actions).toStrictEqual([
      { label: 'Bad', href: '' },
      { label: 'Ok', href: 'https://ok.test' },
    ]);
    const attr = htmlToDoc(
      `<aside data-node="callout" data-actions='[{"label":"Bad","href":"java\\tscript:alert(1)"}]'><p>x</p></aside>`
    );
    expect(attr.content?.[0]?.attrs?.actions).toStrictEqual([{ label: 'Bad', href: '' }]);
  });

  it('markdownToDoc and docToMarkdown filter @btn hrefs', () => {
    expect.hasAssertions();
    const doc = markdownToDoc(':::info T\nbody\n\n@btn[Bad](javascript:void0)\n@btn[Ok](/a)\n:::');
    expect(doc.content?.[0]?.attrs?.actions).toStrictEqual([
      { label: 'Bad', href: '' },
      { label: 'Ok', href: '/a' },
    ]);
    const md = docToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { variant: 'info', actions: [{ label: 'X', href: 'data:text/html,x' }] },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
        },
      ],
    });
    expect(md).toContain('@btn[X]()');
  });
});

describe('ocm atom stub', () => {
  it('round-trips unknown atom type, nested attrs and content through Markdown', () => {
    expect.hasAssertions();
    const atom: DocNode = {
      type: 'timer',
      attrs: { id: 't1', cfg: { end: '2026-01-01', note: 'a --> b' }, n: 3 },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'in' }] }],
    };
    const md = docToMarkdown({ type: 'doc', content: [atom] });
    expect(md).not.toContain('a -->');
    const back = markdownToDoc(md);
    expect(back.content).toStrictEqual([atom]);
  });

  it('reads the legacy k="v" stub', () => {
    expect.hasAssertions();
    const back = markdownToDoc('<!-- ocm:timer id="t&quot;1" mode="up" -->');
    expect(back.content?.[0]).toStrictEqual({
      type: 'timer',
      attrs: { id: 't"1', mode: 'up' },
    });
  });
});
