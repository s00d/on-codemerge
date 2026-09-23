/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@on-codemerge/kernel';
import { setBlockAttr } from '@on-codemerge/sdk';
import { Editor } from '../../../editor/Editor';
import { BlockStylePlugin } from '../index';
import { ToolbarPlugin } from '../../ToolbarPlugin';
import { draftToStyleJson, emptyDraft, parseStyleAttr } from '../constants';

describe('blockStylePlugin helpers', () => {
  it('parseStyleAttr reads known keys only', () => {
    expect.hasAssertions();
    const draft = parseStyleAttr(
      JSON.stringify({ color: '#f00', 'font-size': '18px', display: 'flex', junk: 1 })
    );
    expect(draft.color).toBe('#f00');
    expect(draft['font-size']).toBe('18px');
    expect(draft['background-color']).toBe('');
  });

  it('draftToStyleJson omits empty keys', () => {
    expect.hasAssertions();
    const d = emptyDraft();
    d.color = '#111';
    d['font-size'] = '16px';
    expect(draftToStyleJson(d)).toBe(JSON.stringify({ color: '#111', 'font-size': '16px' }));
    expect(draftToStyleJson(emptyDraft())).toBe('');
  });
});

describe('blockStylePlugin editor', () => {
  let host: HTMLElement;
  let editor: Editor;

  afterEach(() => {
    editor?.destroy?.();
    host?.remove();
  });

  it('apply writes style JSON on selected block', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, {
      plugins: [BlockStylePlugin()],
    });
    editor.setJSON(createDoc([createParagraph([createText('Hello')])]));
    editor.setSelection({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    });

    const draft = emptyDraft();
    draft.color = '#0284c7';
    draft['background-color'] = '#e0f2fe';
    expect(editor.run(setBlockAttr('style', draftToStyleJson(draft)))).toBe(true);

    const para = editor.getJSON().doc.content?.[0];
    expect(para?.attrs?.style).toContain('#0284c7');
    expect(para?.attrs?.style).toContain('background-color');
  });

  it('toolbar opens panel with embedded color well', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, {
      plugins: [ToolbarPlugin(), BlockStylePlugin()],
    });
    editor.setJSON(createDoc([createParagraph([createText('Hi')])]));

    const btn = host.querySelector('[data-id="block-style"]');
    expect(btn).toBeTruthy();
    (btn as HTMLElement).click();

    expect(document.querySelector('.block-style-editor')).toBeTruthy();
    expect(document.querySelector('.bs-panel')).toBeTruthy();
    expect(document.querySelector('.ocm-color-well')).toBeTruthy();
    expect(document.querySelectorAll('.ocm-popup')).toHaveLength(1);
  });
});
