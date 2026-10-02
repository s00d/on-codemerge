import { describe, expect, it } from 'vitest';
import {
  attrsFromDoc,
  emptyEditorDoc,
  normalizeChartAttrs,
  parseText,
  serializeAttrs,
  serializeDoc,
} from '../io';
import { getDriver } from '../drivers';
import { validateSeries } from '../utils/validation';

describe('io.roundtrip', () => {
  it('emptyEditorDoc → attrs → serialize → parse keeps type and series', () => {
    const doc = emptyEditorDoc({
      chartType: 'bubble',
      title: 'Bubbles',
      data: getDriver('bubble').defaults(),
    });
    const attrs = attrsFromDoc(doc);
    expect(attrs.chartType).toBe('bubble');
    expect(validateSeries(attrs.data as never)).toBe(true);

    const text = serializeAttrs(attrs);
    const parsed = parseText(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const again = attrsFromDoc(parsed.doc);
    expect(again.chartType).toBe('bubble');
    expect(again.title).toBe('Bubbles');
    expect(again.data.length).toBeGreaterThan(0);

    const doc2 = emptyEditorDoc(again);
    const text2 = serializeDoc(doc2);
    const parsed2 = parseText(text2);
    expect(parsed2.ok).toBe(true);
    if (parsed2.ok) {
      expect(attrsFromDoc(parsed2.doc).chartType).toBe('bubble');
    }
  });

  it('bar defaults round-trip', () => {
    const attrs = normalizeChartAttrs({
      chartType: 'bar',
      data: getDriver('bar').defaults(),
    });
    const text = serializeAttrs(attrs);
    const parsed = parseText(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(attrsFromDoc(parsed.doc).chartType).toBe('bar');
    }
  });
});
