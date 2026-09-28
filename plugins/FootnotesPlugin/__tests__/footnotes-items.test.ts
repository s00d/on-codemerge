import { describe, expect, it } from 'vitest';
import { readFootnoteItems } from '../index';

describe('footnotes items attr', () => {
  it('reads typed array', () => {
    expect.hasAssertions();
    const items = [{ id: 'a', note: 'n' }];
    expect(readFootnoteItems(items)).toStrictEqual(items);
  });

  it('coerces legacy JSON string', () => {
    expect.hasAssertions();
    expect(readFootnoteItems('[{"id":"a","note":"n"}]')).toStrictEqual([{ id: 'a', note: 'n' }]);
  });

  it('fail-closed on garbage', () => {
    expect.hasAssertions();
    expect(readFootnoteItems('not-json')).toStrictEqual([]);
  });
});
