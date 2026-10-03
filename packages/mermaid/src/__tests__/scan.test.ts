import { describe, expect, it } from 'vitest';
import { forEachLine, normalizeBrLabel, splitWs, stripOuterQuotes, takeIsoDate } from '../scan';

describe('scan helpers', () => {
  it('normalizeBrLabel converts br variants', () => {
    expect(normalizeBrLabel('a<br/>b<br>c<br />d')).toBe('a\nb\nc\nd');
    // Odd `<br></br>`: first empty br becomes newline (remaining markup left as text).
    expect(normalizeBrLabel('a<br></br>b')).toBe('a\n</br>b');
    expect(normalizeBrLabel('plain')).toBe('plain');
  });

  it('stripOuterQuotes strips one pair only', () => {
    expect(stripOuterQuotes('"hi"')).toBe('hi');
    expect(stripOuterQuotes('hi')).toBe('hi');
    expect(stripOuterQuotes('"a"b"')).toBe('a"b');
  });

  it('takeIsoDate finds first YYYY-MM-DD', () => {
    expect(takeIsoDate('x 2024-01-15, 3d', 0)?.value).toBe('2024-01-15');
    expect(takeIsoDate('no date here', 0)).toBeNull();
  });

  it('splitWs tokenizes without regex', () => {
    expect(splitWs('  a  b\tc  ')).toStrictEqual(['a', 'b', 'c']);
    expect(splitWs('')).toStrictEqual([]);
  });

  it('forEachLine handles CRLF, semicolon, and skips empties', () => {
    const lines: string[] = [];
    forEachLine('a\r\nb;\nc\n\n%%x\n', (l) => lines.push(l), { semicolon: true });
    expect(lines).toStrictEqual(['a', 'b', 'c', '%%x']);
  });
});
