import { afterEach, describe, expect, it, vi } from 'vitest';

import { isDarkHost, onColorSchemeChange } from '../colorScheme';

/** MutationObserver callbacks run as microtasks; one macrotask drains them. */
const flush = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('colorScheme', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark', 'unrelated');
  });

  it('follows html.dark and notifies only on real flips', async () => {
    expect(isDarkHost()).toBe(false);
    const cb = vi.fn();
    const off = onColorSchemeChange(cb);

    document.documentElement.classList.add('dark');
    await flush();
    document.documentElement.classList.add('unrelated');
    await flush();
    document.documentElement.classList.remove('dark');
    await flush();

    expect(cb.mock.calls).toStrictEqual([[true], [false]]);
    off();
    document.documentElement.classList.add('dark');
    await flush();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
