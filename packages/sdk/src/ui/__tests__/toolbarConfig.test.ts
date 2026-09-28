import { describe, expect, it } from 'vitest';
import { pluginToolbarPlacement } from '../toolbarConfig';

describe('pluginToolbarPlacement', () => {
  it('keeps plugin defaults when opts omitted', () => {
    expect.hasAssertions();
    expect(pluginToolbarPlacement({ menu: 'insert', order: 50 })).toStrictEqual({
      menu: 'insert',
      order: 50,
    });
  });

  it('menu: null forces bar (no menu field)', () => {
    expect.hasAssertions();
    expect(pluginToolbarPlacement({ menu: 'insert', order: 50 }, { menu: null })).toStrictEqual({
      order: 50,
    });
  });

  it('overrides menu / group / order', () => {
    expect.hasAssertions();
    expect(
      pluginToolbarPlacement(
        { menu: 'insert', order: 50 },
        { menu: 'tools', group: 'tools', order: 10 }
      )
    ).toStrictEqual({ menu: 'tools', group: 'tools', order: 10 });
  });
});
