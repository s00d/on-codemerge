import { describe, expect, it } from 'vitest';
import { changeCalloutKindAt } from '../../elements/calloutEdit';
import {
  applyBullet,
  applyCallout,
  applyCodeFence,
  applyHeading,
  applyInlineMark,
  applyLink,
  applyMermaid,
  applyOrdered,
  applyQuote,
  clearMdStyles,
} from '../mdSourceOps';

describe('mdSourceOps', () => {
  it('applyHeading retargets current line (not append)', () => {
    const next = applyHeading('hello world\n', 0, 0, 1);
    expect(next.text).toBe('# hello world\n');
  });

  it('applyHeading upgrades existing heading level', () => {
    const next = applyHeading('# hello\n', 0, 0, 2);
    expect(next.text).toBe('## hello\n');
  });

  it('applyQuote / applyBullet retarget line', () => {
    expect(applyQuote('note\n', 0, 0).text).toBe('> note\n');
    expect(applyBullet('note\n', 0, 0).text).toBe('- note\n');
  });

  it('applyCodeFence wraps selection', () => {
    const next = applyCodeFence('abc def\n', 0, 3, 'ts');
    expect(next.text).toContain('```ts\nabc\n```');
  });

  it('applyMermaid inserts fence at empty line', () => {
    const next = applyMermaid('\n', 0, 0);
    expect(next.text).toContain('```mermaid');
    expect(next.text).toContain('flowchart LR');
  });

  it('applyCallout changes kind when inside callout', () => {
    const md = ':::info Tip\nHi\n:::\n';
    const next = applyCallout(md, 10, 10, 'warn', 'Warning', (text, pos, kind) =>
      changeCalloutKindAt(text, pos, kind, new Set(['info', 'warn']))
    );
    expect(next.text).toContain(':::warn');
    expect(next.text).not.toContain(':::info');
  });

  it('applyInlineMark wraps / unwraps bold', () => {
    expect(applyInlineMark('hello', 0, 5, '**', '**').text).toBe('**hello**');
    expect(applyInlineMark('**hello**', 0, 9, '**', '**').text).toBe('hello');
    expect(applyInlineMark('xxhelloxx', 2, 7, '**', '**').text).toBe('xx**hello**xx');
  });

  it('applyLink wraps selection', () => {
    expect(applyLink('go here', 0, 2).text).toBe('[go](https://) here');
  });

  it('applyOrdered retargets line', () => {
    expect(applyOrdered('note\n', 0, 0).text).toBe('1. note\n');
  });

  it('clearMdStyles strips selection only', () => {
    expect(clearMdStyles('xx**bold**yy', 2, 10).text).toBe('xxboldyy');
  });

  it('clearMdStyles clears whole doc when collapsed', () => {
    expect(clearMdStyles('**a** and *b* ~~c~~', 0, 0).text).toBe('a and b c');
  });

  it('clearMdStyles skips fenced code', () => {
    const md = '**out**\n```\n**in**\n```\n';
    expect(clearMdStyles(md, 0, 0).text).toBe('out\n```\n**in**\n```\n');
  });
});
