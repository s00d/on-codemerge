/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { TimerPlugin } from '../index';
import { insertAtomAfter } from '@codemerge/sdk';

function samplePayload() {
  const target = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  return {
    id: 't-test-1',
    title: 'Ship',
    description: 'Launch',
    targetDate: target.toISOString(),
    targetTime: '12:00',
    color: '#3b82f6',
    category: 'Work',
    tags: ['a'],
  };
}

describe('timer publish html', () => {
  it('hydrates countdown only in getPublishedHTML', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: [TimerPlugin()] });
    editor.run(
      insertAtomAfter('timer', {
        payload: samplePayload(),
        title: 'Ship',
      })
    );

    expect(editor.getHTML()).not.toContain('timer-countdown');
    const published = editor.getPublishedHTML();
    expect(published).toMatch(/timer-widget[\s\S]*timer-countdown/);
    expect(published).toContain('data-ocm-runtime="timer"');
    expect(published).toContain('timer-unit');

    editor.destroy();
    host.remove();
  });

  it('copy-timer inserts a localized copy into the doc', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: [TimerPlugin()] });
    editor.run(insertAtomAfter('timer', { payload: samplePayload(), title: 'Ship' }));
    const widget = host.querySelector('.timer-widget');
    expect(widget).toBeInstanceOf(HTMLElement);
    editor.ui.menu.open = (items) => {
      items.find((i) => i.label === editor.t('timer.copyTimer'))?.onClick?.();
    };
    widget?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    const timers = (editor.getJSON().doc.content ?? []).filter((n) => n.type === 'timer');
    expect(timers).toHaveLength(2);
    expect(timers[1]?.attrs?.title).toBe(`Ship ${editor.t('timer.copySuffix')}`);
    expect(String(timers[1]?.attrs?.title)).not.toContain('Копия');
    editor.destroy();
    host.remove();
  });
});
