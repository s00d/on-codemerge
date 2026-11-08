import { describe, expect, it } from 'vitest';
import {
  forEachLine,
  normalizeBrLabel,
  splitWs,
  stripOuterQuotes,
  takeIsoDate,
  takeNumber,
} from '../scan';
import { parse } from '../parse';

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

  it('takeNumber reads signed numbers but leaves arrows alone', () => {
    expect(takeNumber(' -12.5 x', 0)).toStrictEqual({ value: -12.5, next: 6 });
    expect(takeNumber('-.5', 0)?.value).toBe(-0.5);
    expect(takeNumber('42', 0)?.value).toBe(42);
    expect(takeNumber('-->', 0)).toBeNull();
    expect(takeNumber('- 3', 0)).toBeNull();
    expect(takeNumber('.', 0)).toBeNull();
  });

  it('xychart y-axis accepts negative bounds; default axis includes negative data', () => {
    const explicit = parse('xychart-beta\n  y-axis -10 --> -2\n  bar [-5, -3]\n');
    expect(explicit.ir?.type === 'xychart' && [explicit.ir.yMin, explicit.ir.yMax]).toStrictEqual([
      -10, -2,
    ]);
    const auto = parse('xychart-beta\n  bar [-5, 3]\n');
    expect(auto.ir?.type === 'xychart' && [auto.ir.yMin, auto.ir.yMax]).toStrictEqual([-5, 3]);
  });
});
