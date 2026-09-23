/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { Editor } from '../../../editor/Editor';
import { TimerPlugin } from '../index';
import { insertAtomAfter } from '@on-codemerge/sdk';

function samplePayload() {
  const target = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  return JSON.stringify({
    id: 't-test-1',
    title: 'Ship',
    description: 'Launch',
    targetDate: target.toISOString(),
    targetTime: '12:00',
    color: '#3b82f6',
    category: 'Work',
    tags: ['a'],
  });
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
});
