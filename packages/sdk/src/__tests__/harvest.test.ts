/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import {
  bindWindowDrag,
  createEmbedSessionStore,
  createFrameScheduler,
  isEditingInside,
} from '../index';
import type { EditorAPI } from '../types';

describe('sdk harvest', () => {
  it('createFrameScheduler coalesces callbacks', async () => {
    expect.hasAssertions();
    const frames = createFrameScheduler();
    let n = 0;
    frames.schedule(() => {
      n += 1;
    });
    frames.schedule(() => {
      n += 1;
    });
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    expect(n).toBe(1);
    frames.cancel();
  });

  it('bindWindowDrag removes window listeners on abort', () => {
    expect.hasAssertions();
    let moves = 0;
    const ac = bindWindowDrag({
      onMove: () => {
        moves += 1;
      },
      onUp: () => undefined,
    });
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    expect(moves).toBe(1);
    ac.abort();
    window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    expect(moves).toBe(1);
  });

  it('embed session store prunes dropped keys', () => {
    expect.hasAssertions();
    const store = createEmbedSessionStore<{ n: number }>();
    const editor = {} as EditorAPI;
    const map = store.forEditor(editor);
    map.set('a', { n: 1 });
    map.set('b', { n: 2 });
    const dropped: number[] = [];
    store.prune(editor, ['a'], (s) => {
      dropped.push(s.n);
    });
    expect(dropped).toStrictEqual([2]);
    expect([...store.forEditor(editor).keys()]).toStrictEqual(['a']);
    store.clear(editor);
  });

  it('isEditingInside detects focused textarea in host', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    const ta = document.createElement('textarea');
    host.append(ta);
    document.body.append(host);
    ta.focus();
    expect(isEditingInside(host)).toBe(true);
    host.remove();
  });
});
