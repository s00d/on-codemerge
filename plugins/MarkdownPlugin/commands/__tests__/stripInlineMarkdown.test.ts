import { describe, expect, it } from 'vitest';
import { stripInlineMarkdown } from '../stripInlineMarkdown';

/**
 * Each case comes from a class of bug found by differential fuzzing against commonmark.js
 * (visible text, block structure and "no styles left" must match the reference).
 */
const CASES: [string, string][] = [
  // Flanking, `_` intraword, rule of 3, delimiter stack.
  ['foo_bar_baz', 'foo_bar_baz'],
  ['a * b * c', 'a * b * c'],
  ['2 * 3 and 4 * 5', '2 * 3 and 4 * 5'],
  ['snake__case__name', 'snake__case__name'],
  ['_em_ and *em* and a*b*c', 'em and em and abc'],
  ['**bold *it* x** __u__ ~~s~~ ***bi***', 'bold it x u s bi'],
  ['*a **b* c**', 'a b c'],
  ['*foo**bar**baz*', 'foobarbaz'],
  ['*(*foo*)*', '(foo)'],
  ['_foo_bar_', 'foo_bar'],
  // Links bind before emphasis; images stay; reference links need a definition.
  ['*[foo*](/u)', '\\*foo\\*'],
  ['[*a*](/u "t") and ![*i*](s.png)', 'a and ![*i*](s.png)'],
  ['[a][r] [r][] [r]\n\n[r]: /u "t*i*t"', 'a r r\n\n[r]: /u "t*i*t"'],
  ['[a][nope] [b] *c*', '[a][nope] [b] c'],
  ['[foo][bar][baz]\n\n[baz]: /url1\n[foo]: /url2', '\\[foo]bar\n\n[baz]: /url1\n[foo]: /url2'],
  ['a[\n[a][nope]("\\[x](u)))', 'a[\n[a]nope)'],
  ['[foo <bar attr="](baz)">', '[foo <bar attr="](baz)">'],
  ['[f](<>())', '[f](<>())'],
  ['[link](/url\u00a0"title")', 'link'],
  ['[!][ref][][ref]\n\n[ref]:"', '\\![][ref]\n\n[ref]:"'],
  // Code spans: content becomes text, escaped where it would parse as markup.
  ['`*a*` and ``x`y``', '\\*a\\* and x\\`y'],
  ['`a\\`', 'a\\\\'],
  ['`<http://x>` and `&amp;`', '\\<http://x> and \\&amp;'],
  ['![`]()``', '![`]()``'],
  ['x\n`#` y', 'x\n\\# y'],
  // New constructs exposed by stripping get escaped.
  ['&*mp;*', '\\&mp;'],
  ['<tp:[*]( )>', '\\<tp:\\*>'],
  ['*  ` **  `', '*  \\** '],
  ['### *a #*', '### a \\#'],
  // Block structure: fences, indented code, HTML blocks, containers, lazy lines.
  ['```\n*keep*\n```\n*x*', '```\n*keep*\n```\nx'],
  ['- *a*\n\n      *code*', '- a\n\n      *code*'],
  ['<div>\n*keep*\n\n*x*', '<div>\n*keep*\n\nx'],
  ['> *a\n> b*', '> a\n> b'],
  ['- > *a*\n> *b*', '- > a\n> b'],
  ['1. a\n*\n*b*', '1. a\n*\nb'],
  ['*>\n*x*', '*>\nx'],
  ['- >_"\n    >*\no_', '- >"\n    >*\no'],
  ['[ref]: /u\n    *para*\n\n[ref]', '[ref]: /u\n    para\n\nref'],
];

describe('stripInlineMarkdown', () => {
  it.each(CASES)('%j', (input, expected) => {
    expect(stripInlineMarkdown(input)).toBe(expected);
  });

  it('is idempotent on every case', () => {
    for (const [, out] of CASES) {
      expect(stripInlineMarkdown(out)).toBe(out);
    }
  });
});
