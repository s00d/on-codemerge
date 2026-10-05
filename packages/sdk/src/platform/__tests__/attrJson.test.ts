import { describe, expect, it } from 'vitest';
import { attrToHtmlValue, coerceHtmlJsonAttr, readJsonAttr, writeJsonAttr } from '../attrJson';

const isArr = (v: unknown): v is number[] => Array.isArray(v);

describe('attrJson', () => {
  it('attrToHtmlValue stringifies objects/arrays', () => {
    expect(attrToHtmlValue({ a: 1 })).toBe('{"a":1}');
    expect(attrToHtmlValue([1, 2])).toBe('[1,2]');
    expect(attrToHtmlValue('x')).toBe('x');
    expect(attrToHtmlValue(3)).toBe('3');
    expect(attrToHtmlValue(true)).toBe('true');
  });

  it('readJsonAttr accepts object or legacy string', () => {
    expect(readJsonAttr([1], [], isArr)).toStrictEqual([1]);
    expect(readJsonAttr('[1,2]', [], isArr)).toStrictEqual([1, 2]);
    expect(readJsonAttr('nope', [], isArr)).toStrictEqual([]);
    expect(readJsonAttr({ a: 1 }, { a: 0 })).toStrictEqual({ a: 1 });
    expect(readJsonAttr('{"a":2}', { a: 0 })).toStrictEqual({ a: 2 });
  });

  it('writeJsonAttr keeps reference (no stringify)', () => {
    const v = [{ name: 'S' }];
    expect(writeJsonAttr(v)).toBe(v);
  });

  it('coerceHtmlJsonAttr parses known keys only', () => {
    expect(coerceHtmlJsonAttr('data', '[{"n":1}]')).toStrictEqual([{ n: 1 }]);
    expect(coerceHtmlJsonAttr('payload', '{"x":1}')).toStrictEqual({ x: 1 });
    expect(coerceHtmlJsonAttr('title', '{"x":1}')).toBe('{"x":1}');
    expect(coerceHtmlJsonAttr('data', 'plain')).toBe('plain');
  });
});
