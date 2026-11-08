import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { HistoryPlugin, HISTORY_SNAPSHOT_DEBOUNCE_MS } from '../index';
import { HistoryViewerModal } from '../components/HistoryViewerModal';
import type { HistoryState } from '../types';

function mk(plugin: ReturnType<typeof HistoryPlugin>) {
  const host = document.createElement('div');
  document.body.append(host);
  const editor = new Editor(host, { plugins: [plugin] });
  return { editor, host };
}

const type = (editor: Editor, text: string) =>
  editor.run(() => [{ type: 'insert_text', path: [0], offset: 0, text }]);

describe('HistoryPlugin snapshots', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debounces getMarkdown on docChanged and clears the timer on destroy', () => {
    vi.useFakeTimers();
    const { editor, host } = mk(HistoryPlugin());
    const md = vi.spyOn(editor, 'getMarkdown');
    type(editor, 'a');
    type(editor, 'b');
    type(editor, 'c');
    expect(md).not.toHaveBeenCalled();
    vi.advanceTimersByTime(HISTORY_SNAPSHOT_DEBOUNCE_MS);
    expect(md).toHaveBeenCalledTimes(1);

    type(editor, 'd');
    editor.destroy();
    vi.advanceTimersByTime(HISTORY_SNAPSHOT_DEBOUNCE_MS * 2);
    expect(md).toHaveBeenCalledTimes(1);
    host.remove();
  });

  it('does not carry snapshots across re-setup of the same plugin instance', () => {
    vi.useFakeTimers();
    let shown: HistoryState[] = [];
    vi.spyOn(HistoryViewerModal.prototype, 'show').mockImplementation((states) => {
      shown = states;
    });
    const plugin = HistoryPlugin();
    const first = mk(plugin);
    first.editor.setHTML('<p>one</p>');
    type(first.editor, 'x');
    vi.advanceTimersByTime(HISTORY_SNAPSHOT_DEBOUNCE_MS);
    first.editor.command('viewHistory');
    expect(shown.some((s) => s.content.includes('xone'))).toBe(true);
    first.editor.destroy();
    first.host.remove();

    const second = mk(plugin);
    second.editor.command('viewHistory');
    expect(shown.some((s) => s.content.includes('xone'))).toBe(false);
    second.editor.destroy();
    second.host.remove();
  });
});
