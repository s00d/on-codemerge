import { describe, expect, it } from 'vitest';
import { createDoc, createParagraph, createText } from '@on-codemerge/kernel';
import { Editor } from '../../editor/Editor';
import {
  blockIndexFromTarget,
  domPointToOffset,
  selectionFromDom,
  textOffsetToDom,
} from '../EditorView';
import { h, mount, renderDetached } from '@on-codemerge/sdk';

describe('editor view branches', () => {
  it('renders headings, lists, tables, code, and atoms', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      plugins: [
        {
          name: 'atom',
          widgets: {
            image: {
              render: (_attrs, ctx) => {
                ctx.updateAttrs({ src: 'b' });
                ctx.openMenu([{ label: 'x' }], 1, 2);
                return h('span', { class: 'img-widget' }, 'pic');
              },
            },
          },
        },
      ],
    });
    editor.setJSON(
      createDoc([
        createParagraph([]),
        {
          type: 'heading',
          attrs: {
            level: 3,
            align: 'center',
            id: 'h1',
            class: 'hero',
            lineHeight: '1.5',
            style: '{"color":"red"}',
          },
          content: [createText('H')],
        },
        {
          type: 'paragraph',
          attrs: { style: 'not-json' },
          content: [createText('p')],
        },
        { type: 'blockquote', content: [createText('q')] },
        { type: 'codeBlock', attrs: { language: 'js' }, content: [createText('const x = 1')] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [createText('a')] }] },
        { type: 'orderedList', content: [{ type: 'listItem', content: [] }] },
        {
          type: 'table',
          attrs: { tableStyle: 'striped' },
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [createParagraph([createText('c')])] },
                { type: 'tableCell', content: [] },
                {
                  type: 'tableCell',
                  content: [{ type: 'heading', attrs: { level: 4 }, content: [createText('x')] }],
                },
              ],
            },
          ],
        },
        { type: 'image', attrs: { src: 'a' } },
        { type: 'mystery', attrs: {} },
        { type: 'heading', attrs: { level: 99 }, content: [] },
      ])
    );
    const html = host.innerHTML;
    expect(html).toContain('data-type="heading"');
    expect(html).toContain('blockquote');
    expect(html).toContain('ocm-code-block');
    expect(html).toContain('<ul');
    expect(html).toContain('<ol');
    expect(html).toContain('html-editor-table');
    expect(html).toContain('table-striped');
    expect(html).toContain('img-widget');
    expect(html).toContain('[mystery]');
    expect(html).toContain('text-align:center');
    expect(html).toContain('id="h1"');
    expect(html).toContain('class="hero"');
    expect(html).toContain('color:red');
    expect(html).toContain('not-json');

    const content = host.querySelector('.ocm-content') as HTMLElement;
    const heading = content.querySelector('[data-type="heading"]') as HTMLElement;
    const textNode = heading.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 0);
    const native = document.getSelection();
    native?.removeAllRanges();
    native?.addRange(range);
    expect(selectionFromDom(content)?.anchor.path.length).toBeGreaterThan(0);
    expect(textOffsetToDom(heading, 99)?.offset).toBeGreaterThanOrEqual(0);
    expect(domPointToOffset(heading, textNode, 0)).toBe(0);
    expect(blockIndexFromTarget(content, null)).toBe(0);

    const atom = content.querySelector('[data-type="image"]') as HTMLElement;
    atom.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    editor.destroy();
    host.remove();
  });

  it('mounts fragments, foreign hosts, and detached roots', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    const handle = mount(host, [
      h(
        'span',
        { class: ['a', ''], attrs: { title: 't', hidden: false }, style: { color: 'red' } },
        'x'
      ),
      h(
        'fragment',
        null,
        h(
          'em',
          {
            on: {
              click: () => {
                void 0;
              },
            },
          },
          'y'
        )
      ),
    ]);
    expect(host.textContent).toContain('x');
    handle.update(h('b', null, 'z'));
    expect(host.textContent).toBe('z');
    handle.destroy();

    const foreign = mount(document.createElement('div'), {
      foreign: (el) => {
        el.textContent = 'f';
      },
    });
    expect(foreign.el.textContent).toBe('f');
    foreign.destroy();

    const detached = renderDetached(h('p', null, 'd'));
    expect(detached.el.textContent).toBe('d');
    detached.destroy();
    expect(() => renderDetached('nope')).toThrow(/HTMLElement/);
  });
});
