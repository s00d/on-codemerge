import { describe, expect, it } from 'vitest';
import { ParseError, parseJsonPayload } from '../parseSoT';

describe('parseSoT', () => {
  it('ParseError keeps name and optional offset', () => {
    const err = new ParseError('boom', 12);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ParseError);
    expect(err.name).toBe('ParseError');
    expect(err.message).toBe('boom');
    expect(err.offset).toBe(12);
    expect(new ParseError('x').offset).toBeUndefined();
  });

  it('parseJsonPayload rejects oversized text', () => {
    const r = parseJsonPayload('{"a":1}', 3, 'too big');
    expect(r).toStrictEqual({ ok: false, message: 'too big' });
  });

  it('parseJsonPayload treats blank as empty', () => {
    expect(parseJsonPayload('', 100, 'too big')).toStrictEqual({ ok: true, empty: true });
    expect(parseJsonPayload('   \n\t  ', 100, 'too big')).toStrictEqual({ ok: true, empty: true });
  });

  it('parseJsonPayload parses objects', () => {
    const r = parseJsonPayload('{"x":1}', 100, 'too big');
    expect(r).toStrictEqual({ ok: true, empty: false, value: { x: 1 } });
  });

  it('parseJsonPayload returns message on invalid JSON', () => {
    const r = parseJsonPayload('{', 100, 'too big');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message.length).toBeGreaterThan(0);
    }
  });
});
