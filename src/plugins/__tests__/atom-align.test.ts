/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@on-codemerge/kernel';
import { Editor } from '../../editor/Editor';
import { AlignmentPlugin } from '../AlignmentPlugin';
import { MathPlugin } from '../MathPlugin';
import { TimerPlugin } from '../TimerPlugin';
import { h } from '@on-codemerge/sdk';

describe('atom toolbar alignment', () => {
  let host: HTMLElement;
  let editor: Editor;

  afterEach(() => {
    editor?.destroy?.();
    host?.remove();
  });

  it('setBlockAttr align updates selected math atom attrs and container margins', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, {
      plugins: [AlignmentPlugin(), MathPlugin()],
    });
    editor.setJSON(
      createDoc([
        createParagraph([createText('before')]),
        {
          type: 'math',
          attrs: {
            expression: String.raw`\sum_{n=1}^{\infty} \frac{1}{n^2}`,
            align: '',
            width: 0,
            height: 0,
          },
        },
      ])
    );

    editor.setSelection({
      anchor: { path: [1], offset: 0 },
      focus: { path: [1], offset: 0 },
    });
    expect(editor.command('alignRight')).toBe(true);

    const math = editor.getJSON().doc.content?.[1];
    expect(math?.type).toBe('math');
    expect(math?.attrs?.align).toBe('right');

    const box = host.querySelector('.math-container') as HTMLElement | null;
    expect(box).toBeTruthy();
    expect(box?.style.marginLeft).toBe('auto');
    expect(box?.style.marginRight).toBe('0px');
  });

  it('alignCenter sets margin auto on both sides', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, {
      plugins: [AlignmentPlugin(), MathPlugin()],
    });
    editor.setJSON(
      createDoc([
        {
          type: 'math',
          attrs: { expression: 'x^2', align: 'left', width: 0, height: 0 },
        },
      ])
    );
    editor.setSelection({
      anchor: { path: [0], offset: 0 },
      focus: { path: [0], offset: 0 },
    });
    expect(editor.command('alignCenter')).toBe(true);
    const box = host.querySelector('.math-container') as HTMLElement;
    expect(box.style.marginLeft).toBe('auto');
    expect(box.style.marginRight).toBe('auto');
  });

  it('toolbar align updates timer atom host margins', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, {
      plugins: [AlignmentPlugin(), TimerPlugin()],
    });
    const target = new Date(Date.now() + 86_400_000).toISOString();
    editor.setJSON(
      createDoc([
        {
          type: 'timer',
          attrs: {
            title: 'Ship',
            align: '',
            payload: JSON.stringify({
              id: 't-align-1',
              title: 'Ship',
              description: '',
              targetDate: target,
              targetTime: '12:00',
              color: '#0284c7',
              category: '',
              tags: [],
            }),
          },
        },
      ])
    );
    editor.setSelection({
      anchor: { path: [0], offset: 0 },
      focus: { path: [0], offset: 0 },
    });
    expect(editor.command('alignCenter')).toBe(true);
    expect(editor.getJSON().doc.content?.[0]?.attrs?.align).toBe('center');
    const box = host.querySelector('.ocm-timer-atom') as HTMLElement;
    expect(box).toBeTruthy();
    expect(box.style.marginLeft).toBe('auto');
    expect(box.style.marginRight).toBe('auto');
  });

  it('mousedown on atom pins selection so align hits the atom', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, {
      plugins: [
        AlignmentPlugin(),
        {
          name: 'stub-math',
          nodes: [
            { name: 'math', group: 'atom', atom: true, attrs: { align: '', expression: '' } },
          ],
          widgets: {
            math: {
              render: () => h('div', { class: 'stub-math' }, 'Σ'),
            },
          },
        },
      ],
    });
    editor.setJSON(
      createDoc([
        createParagraph([createText('para')]),
        { type: 'math', attrs: { expression: 'x', align: '' } },
      ])
    );

    // Caret still on paragraph
    editor.setSelection({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    });

    const atom = host.querySelector('[data-ocm-atom="1"]') as HTMLElement;
    expect(atom).toBeTruthy();
    atom.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    atom.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));

    expect(editor.getSelection().anchor.path).toStrictEqual([1]);
    expect(editor.command('alignLeft')).toBe(true);
    expect(editor.getJSON().doc.content?.[1]?.attrs?.align).toBe('left');
    // Paragraph untouched
    expect(editor.getJSON().doc.content?.[0]?.attrs?.align ?? '').toBe('');
  });
});
