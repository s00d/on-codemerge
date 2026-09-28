import { describe, expect, it } from 'vitest';
import { docToValue, toEditorDoc, valueToDoc } from '../adapters';
import { ParseError, parseText, serializeText } from '../text';

describe('json adapters', () => {
  it('round-trips canonical values', () => {
    const samples: unknown[] = [
      null,
      true,
      false,
      0,
      1.5,
      '',
      'hi',
      [],
      [1, true, 'x'],
      {},
      { a: [1, true, 'x'] },
    ];
    for (const sample of samples) {
      const jsonRoot = valueToDoc(sample);
      expect(jsonRoot.type).toBe('json');
      expect(docToValue(jsonRoot)).toStrictEqual(sample);
      expect(docToValue(toEditorDoc(jsonRoot))).toStrictEqual(sample);
    }
  });

  it('parseText / serializeText', () => {
    const text = '{"a":[1,true,"x"]}';
    const result = parseText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.doc.type).toBe('doc');
    expect(docToValue(result.doc)).toStrictEqual({ a: [1, true, 'x'] });
    expect(JSON.parse(serializeText(result.value))).toStrictEqual({ a: [1, true, 'x'] });
  });

  it('decodeValue keeps __proto__ as own key (no prototype forgery)', () => {
    const parsed = parseText('{"__proto__":{"polluted":true},"ok":1}');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const value = docToValue(parsed.doc) as Record<string, unknown>;
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    expect(Object.hasOwn(value, '__proto__')).toBe(true);
    expect(Object.hasOwn(value, 'ok')).toBe(true);
    expect(value.ok).toBe(1);
    expect((value as { polluted?: unknown }).polluted).toBeUndefined();
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });

  it('parseText invalid → ParseError', () => {
    const result = parseText('{');
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toBeInstanceOf(ParseError);
  });
});
