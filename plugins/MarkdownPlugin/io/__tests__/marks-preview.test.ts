import { describe, expect, it } from 'vitest';
import { markdownToDoc } from '@ocm/wysiwyg/io/markdown';
import { sanitizeHTML } from '@ocm/wysiwyg/utils/safeHtml';
import { projectPreviewHtml } from '../projectPreview';

/** Every mark variant must keep visible text through parse → project → sanitize. */
const MARK_CASES: { name: string; md: string; mustInclude: string[] }[] = [
  {
    name: 'paragraph bold',
    md: 'Edit on the **left**.\n',
    mustInclude: ['left', '<strong>'],
  },
  {
    name: 'paragraph italic',
    md: 'Preview on the *right*.\n',
    mustInclude: ['right', '<em>'],
  },
  {
    name: 'paragraph strike',
    md: 'gone ~~strike~~ here\n',
    mustInclude: ['strike', '<s>'],
  },
  {
    name: 'paragraph inline code',
    md: 'use `code` please\n',
    mustInclude: ['code', '<code>'],
  },
  {
    name: 'paragraph link',
    md: 'see [docs](https://example.com)\n',
    mustInclude: ['docs', '<a ', 'https://example.com'],
  },
  {
    name: 'paragraph nested italic+strike',
    md: 'Preview on the *~~right~~*.\n',
    mustInclude: ['right', '<em>', '<s>'],
  },
  {
    name: 'paragraph bold+italic',
    md: '**_both_**\n',
    mustInclude: ['both', '<strong>', '<em>'],
  },
  {
    name: 'heading bold+nested strike',
    md: '# Edit on the **left**. Preview on the *~~right~~*.\n',
    mustInclude: ['left', 'right', '<strong>', '<em>', '<s>', '<h1>'],
  },
  {
    name: 'heading h2 bold',
    md: '## **Title**\n',
    mustInclude: ['Title', '<strong>', '<h2>'],
  },
  {
    name: 'blockquote marks',
    md: '> **bold** and ~~strike~~\n',
    mustInclude: ['bold', 'strike', '<strong>', '<s>', '<blockquote>'],
  },
  {
    name: 'bullet list marks',
    md: '- **bold** item\n- ~~strike~~ item\n',
    mustInclude: ['bold', 'strike', '<strong>', '<s>', '<ul>'],
  },
  {
    name: 'ordered list marks',
    md: '1. *italic* one\n2. `code` two\n',
    mustInclude: ['italic', 'code', '<em>', '<code>', '<ol>'],
  },
  {
    name: 'callout body bold',
    md: ':::info Tip\nUse **Insert** / **Turn into** for callouts.\n:::\n',
    mustInclude: ['Insert', 'Turn into', '<strong>', 'ocm-md-callout'],
  },
  {
    name: 'callout body strike+italic',
    md: ':::warn Note\nAvoid *~~this~~*.\n:::\n',
    mustInclude: ['this', '<em>', '<s>'],
  },
  {
    name: 'mixed document',
    md: [
      '# **Head** with ~~gone~~\n',
      '\n',
      'Para **bold** *italic* ~~strike~~ `code` [a](https://x)\n',
      '\n',
      ':::info Tip\nBody **x**\n:::\n',
    ].join(''),
    mustInclude: ['Head', 'gone', 'bold', 'italic', 'strike', 'code', 'Body', '<strong>', '<s>'],
  },
];

describe('MD marks → preview (all contexts)', () => {
  for (const c of MARK_CASES) {
    it(`marks: ${c.name}`, () => {
      const doc = markdownToDoc(c.md);
      const preview = projectPreviewHtml(doc);
      for (const token of c.mustInclude) {
        expect(preview.includes(token)).toBe(true);
      }
      // Marked words must never vanish into empty wrappers.
      expect(preview).not.toMatch(/<em>\s*<\/em>/);
      expect(preview).not.toMatch(/<strong>\s*<\/strong>/);
      expect(preview).not.toMatch(/<s>\s*<\/s>/);
    });
  }

  it('sanitize keeps <s> text (regression)', () => {
    const dirty = '<h1>Edit <em><s>right</s></em>.</h1>';
    const clean = sanitizeHTML(dirty);
    expect(clean).toContain('right');
    expect(clean).toContain('<s>');
  });

  it('sanitize unwraps unknown tags (keeps text)', () => {
    const clean = sanitizeHTML('<p>hi <custom>there</custom></p>');
    expect(clean).toContain('hi');
    expect(clean).toContain('there');
    expect(clean).not.toContain('<custom');
  });

  it('sanitize still drops script', () => {
    const clean = sanitizeHTML('<p>ok</p><script>alert(1)</script>');
    expect(clean).toContain('ok');
    expect(clean).not.toContain('<script');
  });
});
