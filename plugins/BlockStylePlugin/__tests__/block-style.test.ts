/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@on-codemerge/kernel';
import { setBlockAttr } from '@on-codemerge/sdk';
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { BlockStylePlugin } from '../index';
import { ToolbarPlugin } from '../../ToolbarPlugin';
import { draftToStyleJson, emptyDraft, parseStyleAttr } from '../constants';

describe('blockStylePlugin helpers', () => {
  it('parseStyleAttr reads known keys only (typed + legacy string)', () => {
    expect.hasAssertions();
    const raw = { color: '#f00', 'font-size': '18px', display: 'flex', junk: 1 };
    const draft = parseStyleAttr(raw);
    expect(draft.color).toBe('#f00');
    expect(draft['font-size']).toBe('18px');
    expect(draft['background-color']).toBe('');
    expect(parseStyleAttr(JSON.stringify(raw)).color).toBe('#f00');
  });

  it('draftToStyleJson omits empty keys (typed object)', () => {
    expect.hasAssertions();
    const d = emptyDraft();
    d.color = '#111';
    d['font-size'] = '16px';
    expect(draftToStyleJson(d)).toStrictEqual({ color: '#111', 'font-size': '16px' });
    expect(draftToStyleJson(emptyDraft())).toBe('');
  });

  it('parseStyleAttr accepts typed object', () => {
    expect.hasAssertions();
    const draft = parseStyleAttr({ color: '#0f0', 'font-size': '12px' });
    expect(draft.color).toBe('#0f0');
    expect(draft['font-size']).toBe('12px');
  });
});

describe('blockStylePlugin editor', () => {
  let host: HTMLElement;
  let editor: Editor;

  afterEach(() => {
    editor?.destroy?.();
    host?.remove();
  });

  it('apply writes typed style object on selected block', () => {
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
    expect(para?.attrs?.style).toStrictEqual({
      color: '#0284c7',
      'background-color': '#e0f2fe',
    });
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
