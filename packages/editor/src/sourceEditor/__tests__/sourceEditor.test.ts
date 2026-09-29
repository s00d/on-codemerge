/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from 'vitest';
import {
  mountSourceEditor,
  sourceContentHeight,
  sourceGutterWidthPx,
  sourceScrollPadBottom,
} from '../mountSourceEditor';

async function flushPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function gridColPx(el: HTMLElement): number {
  return Math.trunc(Number(/^(\d+)/.exec(el.style.gridTemplateColumns)?.[1] ?? '0'));
}

describe('source scroll metrics', () => {
  it('content height and pad bottom track scrollHeight quirks', () => {
    expect.hasAssertions();
    expect(sourceContentHeight(1)).toBe(20 + 8);
    expect(sourceContentHeight(27)).toBe(27 * 20 + 8);
    expect(sourceScrollPadBottom(560, 27)).toBe(560 - (27 * 20 + 8));
    expect(sourceScrollPadBottom(100, 27)).toBe(0);
  });

  it('gutter width is pixel floor, never hairline', () => {
    expect.hasAssertions();
    expect(sourceGutterWidthPx(1, 8)).toBeGreaterThanOrEqual(36);
    expect(sourceGutterWidthPx(5, 8)).toBeGreaterThan(sourceGutterWidthPx(1, 8));
  });
});

describe('mountSourceEditor', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts) {
      host.remove();
    }
    hosts.length = 0;
  });

  function mount(initial = 'const x = 1;') {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    let dirty = 0;
    const handle = mountSourceEditor(host, {
      initialText: initial,
      onDocChanged: () => {
        dirty += 1;
      },
    });
    return { host, handle, getDirty: () => dirty };
  }

  it('getText/setText/replaceText and caret APIs', () => {
    expect.hasAssertions();
    const { handle } = mount('ab');
    expect(handle.getText()).toBe('ab');
    handle.setText('hello');
    expect(handle.getText()).toBe('hello');
    handle.replaceText('xy', 1);
    expect(handle.getText()).toBe('xy');
    expect(handle.getCursor()).toBe(1);
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(0, 2);
    expect(handle.getSelection()).toStrictEqual({ from: 0, to: 2 });
    handle.destroy();
    expect(handle.getText()).toBe('');
  });

  it('wrap=off so caret and mirror share no-soft-wrap geometry', () => {
    expect.hasAssertions();
    const { handle, host } = mount();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    expect(ta.getAttribute('wrap')).toBe('off');
    expect(ta.style.webkitTextFillColor).toBe('transparent');
    expect(ta.style.caretColor.length).toBeGreaterThan(0);
    expect(host.querySelector('.ocm-source-editor')?.className.split(/\s+/)).toContain('not-prose');
    const mirror = host.querySelector('.ocm-source-editor__mirror');
    expect(mirror?.className.split(/\s+/)).toContain('bg-transparent');
    handle.destroy();
  });

  it('gutter line count tracks newlines', async () => {
    expect.hasAssertions();
    const { handle, host } = mount('a\nb\nc');
    await flushPaint();
    expect(handle.getLineCount()).toBe(3);
    const lines = host.querySelectorAll('.ocm-source-editor__gutter-line');
    expect([...lines].map((el) => el.textContent)).toStrictEqual(['1', '2', '3']);
    expect(lines[0]?.getAttribute('data-line')).toBe('1');
    handle.setText('only');
    await flushPaint();
    expect(handle.getLineCount()).toBe(1);
    expect(host.querySelectorAll('.ocm-source-editor__gutter-line')).toHaveLength(1);
    handle.destroy();
  });

  it('virtual gutter does not mount 10k DOM rows', async () => {
    expect.hasAssertions();
    const huge = Array.from({ length: 10_000 }, (_, i) => `row ${i}`).join('\n');
    const { handle, host } = mount('x');
    const rail = host.querySelector('.ocm-source-editor__gutter') as HTMLElement;
    Object.defineProperty(rail, 'clientHeight', { configurable: true, value: 200 });
    handle.setText(huge);
    await flushPaint();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    // jsdom has no layout — mock scroll metrics so windowing can engage.
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, value: 200_000 });
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 200 });
    ta.scrollTop = 4000;
    ta.dispatchEvent(new Event('scroll'));
    expect(handle.getLineCount()).toBe(10_000);
    const mounted = host.querySelectorAll('.ocm-source-editor__gutter-line').length;
    expect(mounted).toBeGreaterThan(5);
    expect(mounted).toBeLessThan(80);
    const first = host.querySelector('.ocm-source-editor__gutter-line') as HTMLElement;
    expect(Number(first.getAttribute('data-line'))).toBeGreaterThan(100);
    handle.destroy();
  });

  it('Tab inserts indent without leaving the textarea', () => {
    expect.hasAssertions();
    const { handle } = mount('x');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(0, 0);
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(handle.getText()).toBe('  x');
    expect(document.activeElement).toBe(ta);
    handle.destroy();
  });

  it('Tab on full-line selection does not indent the next line', () => {
    expect.hasAssertions();
    const { handle } = mount('aaa\nbbb\nccc');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(0, 4);
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(handle.getText()).toBe('  aaa\nbbb\nccc');
    handle.destroy();
  });

  it('Shift-Tab unindents and keeps focus', () => {
    expect.hasAssertions();
    const { handle } = mount('  hello');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(2, 2);
    const ev = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    ta.dispatchEvent(ev);
    expect(handle.getText()).toBe('hello');
    expect(ev.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(ta);
    handle.destroy();
  });

  it('paste via beforeinput records undo', () => {
    expect.hasAssertions();
    const { handle } = mount('ab');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(2, 2);
    ta.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertFromPaste',
        data: 'XY',
        bubbles: true,
        cancelable: true,
      })
    );
    ta.setRangeText('XY', 2, 2, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(handle.getText()).toBe('abXY');
    ta.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true })
    );
    expect(handle.getText()).toBe('ab');
    handle.destroy();
  });

  it('typing after undo clears redo', () => {
    expect.hasAssertions();
    const { handle } = mount('a');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(1, 1);
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    ta.setRangeText('b', 1, 1, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    // coalesce baseline: flush by Mod-z path after timer-less push via second edit record
    ta.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true })
    );
    expect(handle.getText()).toBe('a');
    ta.setSelectionRange(1, 1);
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    ta.setRangeText('c', 1, 1, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(handle.getText()).toBe('ac');
    ta.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(handle.getText()).toBe('ac');
    handle.destroy();
  });

  it('source editor uses CSS grid with pixel gutter track', () => {
    expect.hasAssertions();
    const { handle, host } = mount('line\n'.repeat(40));
    const root = host.querySelector('.ocm-source-editor') as HTMLElement;
    expect(root.style.display).toBe('grid');
    expect(root.style.gridTemplateColumns).toMatch(/^\d+px minmax\(0,\s*1fr\)$/);
    expect(root.style.alignItems).toBe('stretch');
    const rail = host.querySelector('.ocm-source-editor__gutter') as HTMLElement;
    expect(rail.style.contain).toBe('strict');
    expect(rail.className).toContain('overflow-hidden');
    const inner = host.querySelector('.ocm-source-editor__gutter-inner') as HTMLElement;
    expect(inner.className).toContain('absolute');
    handle.destroy();
  });

  it('insertAtCursor updates text + notify', () => {
    expect.hasAssertions();
    const { handle, getDirty } = mount('ab');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(1, 1);
    handle.insertAtCursor('X');
    expect(handle.getText()).toBe('aXb');
    expect(getDirty()).toBeGreaterThan(0);
    handle.destroy();
  });

  it('Mod-z undoes Tab and insertAtCursor (local stack)', () => {
    expect.hasAssertions();
    const { handle, getDirty } = mount('x');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.setSelectionRange(0, 0);
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(handle.getText()).toBe('  x');
    const afterTab = getDirty();
    ta.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true })
    );
    expect(handle.getText()).toBe('x');
    expect(getDirty()).toBeGreaterThan(afterTab);
    ta.setSelectionRange(1, 1);
    handle.insertAtCursor('Y');
    expect(handle.getText()).toBe('xY');
    ta.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true })
    );
    expect(handle.getText()).toBe('x');
    handle.destroy();
  });

  it('setText clears undo so Mod-z does not resurrect stale buffer', () => {
    expect.hasAssertions();
    const { handle } = mount('ab');
    handle.focus();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    handle.insertAtCursor('Z');
    handle.setText('fresh');
    ta.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true, cancelable: true })
    );
    expect(handle.getText()).toBe('fresh');
    handle.destroy();
  });

  it('Mod-s triggers onApplyRequest', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    let applied = 0;
    const handle = mountSourceEditor(host, {
      initialText: '{}',
      onDocChanged: () => {},
      onApplyRequest: () => {
        applied += 1;
      },
    });
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    ta.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true, cancelable: true })
    );
    expect(applied).toBe(1);
    handle.destroy();
  });

  it('mirror scrollTop follows textarea scrollTop', async () => {
    expect.hasAssertions();
    const { handle, host } = mount('line\n'.repeat(80));
    await flushPaint();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    const mirror = host.querySelector('.ocm-source-editor__mirror') as HTMLElement;
    const gutterInner = host.querySelector('.ocm-source-editor__gutter-inner') as HTMLElement;
    const rail = host.querySelector('.ocm-source-editor__gutter') as HTMLElement;
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(mirror, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(mirror, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(gutterInner, 'offsetHeight', { configurable: true, value: 2000 });
    Object.defineProperty(rail, 'clientHeight', { configurable: true, value: 200 });
    ta.scrollTop = 400;
    ta.dispatchEvent(new Event('scroll'));
    expect(mirror.scrollTop).toBe(400);
    expect(gutterInner.style.transform).toBe('translateY(-400px)');
    handle.destroy();
  });

  it('gutter translateY clamps to textarea max scroll (no end overshoot)', async () => {
    expect.hasAssertions();
    const { handle, host } = mount('line\n'.repeat(80));
    await flushPaint();
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    const gutterInner = host.querySelector('.ocm-source-editor__gutter-inner') as HTMLElement;
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(ta, 'clientHeight', { configurable: true, value: 200 });
    ta.scrollTop = 9999;
    ta.dispatchEvent(new Event('scroll'));
    // maxFromTa = 1800
    expect(gutterInner.style.transform).toBe('translateY(-1800px)');
    handle.destroy();
  });

  it('textarea and mirror pin scrollbar-gutter stable', () => {
    expect.hasAssertions();
    const { handle, host } = mount('x');
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    const mirror = host.querySelector('.ocm-source-editor__mirror') as HTMLElement;
    expect(ta.style.scrollbarGutter).toBe('stable');
    expect(mirror.style.scrollbarGutter).toBe('stable');
    handle.destroy();
  });

  it('gutter grid column grows with digit count', async () => {
    expect.hasAssertions();
    const { handle, host } = mount('x');
    await flushPaint();
    const root = host.querySelector('.ocm-source-editor') as HTMLElement;
    expect(root.style.gridTemplateColumns).toMatch(/^\d+px minmax\(0,\s*1fr\)$/);
    const narrowPx = gridColPx(root);
    handle.setText(`${'a\n'.repeat(99)}z`);
    await flushPaint();
    const widePx = gridColPx(root);
    expect(narrowPx).toBeGreaterThanOrEqual(36);
    expect(widePx).toBeGreaterThanOrEqual(narrowPx);
    handle.destroy();
  });

  it('gutter and textarea share pinned line metrics', () => {
    expect.hasAssertions();
    const { handle, host } = mount('a\nb');
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    const line = host.querySelector('.ocm-source-editor__gutter-line') as HTMLElement;
    expect(ta.style.lineHeight).toBe('20px');
    expect(ta.style.fontSize).toBe('13px');
    expect(line?.style.height).toBe('20px');
    expect(line?.style.lineHeight).toBe('20px');
    handle.destroy();
  });

  it('gutter width grows with digit count', async () => {
    expect.hasAssertions();
    const { handle, host } = mount('x');
    await flushPaint();
    const root = host.querySelector('.ocm-source-editor') as HTMLElement;
    const w1 = gridColPx(root);
    handle.setText(`${'a\n'.repeat(9)}z`);
    await flushPaint();
    expect(handle.getLineCount()).toBe(10);
    const w10 = gridColPx(root);
    expect(w10).toBe(w1);
    handle.setText(`${'a\n'.repeat(99)}z`);
    await flushPaint();
    expect(handle.getLineCount()).toBe(100);
    const w100 = gridColPx(root);
    expect(w100).toBeGreaterThan(w10);
    handle.destroy();
  });

  it('empty undo stack still preventDefaults Mod-z (owns history)', () => {
    expect.hasAssertions();
    const { handle } = mount('ab');
    const ta = handle.scrollDOM as HTMLTextAreaElement;
    const ev = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    ta.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(handle.getText()).toBe('ab');
    handle.destroy();
  });
});
