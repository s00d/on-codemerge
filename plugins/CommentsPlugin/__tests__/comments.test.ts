import { describe, expect, it } from 'vitest';
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { CommentsPlugin, findComment } from '../index';

function setup() {
  const host = document.createElement('div');
  document.body.append(host);
  const editor = new Editor(host, { plugins: [CommentsPlugin()] });
  editor.setHTML('<p>hello world</p>');
  editor.run(() => [
    {
      type: 'set_mark',
      path: [0],
      from: 0,
      to: 5,
      mark: { type: 'comment', attrs: { id: 'c1', text: 'note' } },
    },
  ]);
  editor.setSelection({ anchor: { path: [0], offset: 2 }, focus: { path: [0], offset: 2 } });
  return {
    editor,
    done: () => {
      editor.destroy();
      host.remove();
      document.querySelectorAll('.ocm-popup').forEach((p) => p.remove());
    },
  };
}

const hasComment = (editor: Editor) => JSON.stringify(editor.getJSON().doc).includes('"comment"');

describe('CommentsPlugin', () => {
  it('finds the full comment range under the caret', () => {
    const { editor, done } = setup();
    expect(findComment(editor.getState())).toMatchObject({
      from: 0,
      to: 5,
      id: 'c1',
      text: 'note',
    });
    editor.setSelection({ anchor: { path: [0], offset: 8 }, focus: { path: [0], offset: 8 } });
    expect(findComment(editor.getState())).toBeNull();
    done();
  });

  it('delete button removes the comment mark', () => {
    const { editor, done } = setup();
    expect(hasComment(editor)).toBe(true);
    editor.command('addComment');
    const del = [...document.querySelectorAll<HTMLButtonElement>('.comment-menu button')].find(
      (b) => b.textContent === editor.t('comments.deleteComment')
    );
    expect(del).toBeTruthy();
    del?.click();
    expect(hasComment(editor)).toBe(false);
    done();
  });

  it('new comment popup has no delete button', () => {
    const { editor, done } = setup();
    editor.setSelection({ anchor: { path: [0], offset: 8 }, focus: { path: [0], offset: 8 } });
    editor.command('addComment');
    const labels = [...document.querySelectorAll('.comment-menu button')].map((b) => b.textContent);
    expect(labels).not.toContain(editor.t('comments.deleteComment'));
    done();
  });
});
