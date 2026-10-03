/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from 'vitest';
import { collectPublishNodes, insertAtomAfter } from '@codemerge/sdk';
import { Editor } from '../../editor/Editor';
import {
  BlockPlugin,
  CalendarPlugin,
  ChartsPlugin,
  FileUploadPlugin,
  FormBuilderPlugin,
  JsonPlugin,
  MarkdownPlugin,
  MathPlugin,
  PDFEmbedPlugin,
  TimerPlugin,
  VideoPlugin,
  YouTubeVideoPlugin,
} from '@ocm/plugins';
import { docToHTML, docToPublishedHTML } from '../html';

function withEditor(
  plugins: Parameters<typeof Editor>[1]['plugins'],
  run: (editor: Editor) => void
) {
  const host = document.createElement('div');
  document.body.append(host);
  const editor = new Editor(host, { plugins });
  try {
    run(editor);
  } finally {
    editor.destroy();
    host.remove();
  }
}

/** Published HTML must not be a bare empty data-node shell for these atoms. */
function expectRichPublish(published: string, node: string, mustInclude: string | RegExp): void {
  expect(published).toContain(`data-node="${node}"`);
  // Bare shell: only attrs, no children / media / runtime markup.
  const bare = new RegExp(`<div data-node="${node}"[^>]*></div>`, 'i');
  expect(published).not.toMatch(bare);
  if (typeof mustInclude === 'string') {
    expect(published).toContain(mustInclude);
  } else {
    expect(published).toMatch(mustInclude);
  }
}

describe('getPublishedHTML atom coverage', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('chart: published is img, semantic HTML stays data-node shell', () => {
    expect.hasAssertions();
    withEditor([ChartsPlugin()], (editor) => {
      editor.run(
        insertAtomAfter('chart', {
          chartType: 'bar',
          data: [{ name: 'S', data: [{ label: 'A', value: 3 }] }],
          title: 'Sales',
          width: 400,
          height: 200,
        })
      );
      const semantic = editor.getHTML();
      expect(semantic).toContain('data-node="chart"');
      expect(semantic).not.toContain('ocm-chart-publish');
      const published = editor.getPublishedHTML();
      expectRichPublish(published, 'chart', 'ocm-chart-publish');
      expect(published).toContain('<img');
      expect(published).toContain('data:image/svg+xml');
    });
  });

  it('timer / calendar keep runtime markup', () => {
    expect.hasAssertions();
    withEditor([TimerPlugin(), CalendarPlugin()], (editor) => {
      const target = new Date(Date.now() + 86400000).toISOString();
      editor.run(
        insertAtomAfter('timer', {
          payload: {
            id: 't1',
            title: 'Ship',
            description: '',
            targetDate: target,
            targetTime: '12:00',
            color: '#3b82f6',
            category: '',
            tags: [],
          },
          title: 'Ship',
        })
      );
      expectRichPublish(editor.getPublishedHTML(), 'timer', 'timer-countdown');
    });
  });

  it('math / json_embed / md_embed are rich in published HTML', () => {
    expect.hasAssertions();
    withEditor(
      [MathPlugin(), JsonPlugin({ surface: 'atom' }), MarkdownPlugin({ surface: 'atom' })],
      (editor) => {
        editor.run(
          insertAtomAfter('math', {
            expression: String.raw`a+b`,
            align: '',
            width: 200,
            height: 80,
          })
        );
        editor.run(insertAtomAfter('json_embed', { text: '{"ok":true}' }));
        editor.run(insertAtomAfter('md_embed', { text: '# Hi\n' }));
        const published = editor.getPublishedHTML();
        expect(published).toContain('data-node="math"');
        expect(published).toContain('<math');
        expectRichPublish(published, 'json_embed', 'ocm-json-publish');
        expect(published).toContain('data-node="md_embed"');
      }
    );
  });

  it('video / youtube / pdf / file / form / block_container publish rich markup', () => {
    expect.hasAssertions();
    withEditor(
      [
        VideoPlugin(),
        YouTubeVideoPlugin(),
        PDFEmbedPlugin(),
        FileUploadPlugin(),
        FormBuilderPlugin(),
        BlockPlugin(),
      ],
      (editor) => {
        editor.run(insertAtomAfter('video', { src: 'https://example.com/a.mp4', align: '' }));
        editor.run(
          insertAtomAfter('youtube', { videoId: 'dQw4w9WgXcQ', align: '', width: 400, height: 225 })
        );
        editor.run(
          insertAtomAfter('pdf', {
            url: 'https://example.com/a.pdf',
            width: 400,
            height: 300,
            align: '',
          })
        );
        editor.run(
          insertAtomAfter('file', {
            fileId: 'f1',
            name: 'doc.pdf',
            size: 12,
            sizeLabel: '12 B',
          })
        );
        editor.run(
          insertAtomAfter('form', {
            schema: {
              id: 'f1',
              action: '/x',
              method: 'POST',
              fields: [{ id: 'n', type: 'text', label: 'Name', required: false }],
            },
            action: '/x',
            align: '',
          })
        );
        editor.run(
          insertAtomAfter('block_container', {
            layout: 'stack',
            tree: { kind: 'leaf' },
            width: 0,
            height: 0,
          })
        );
        const published = editor.getPublishedHTML();
        expectRichPublish(published, 'video', '<video');
        expectRichPublish(published, 'youtube', 'youtube.com/embed/');
        expectRichPublish(published, 'pdf', 'pdf-embed');
        expectRichPublish(published, 'file', 'file-link');
        expectRichPublish(published, 'form', '<form');
        expectRichPublish(published, 'block_container', 'ocm-block-publish');
      }
    );
  });

  it('collectPublishNodes covers interactive atoms', () => {
    expect.hasAssertions();
    const map = collectPublishNodes([
      ChartsPlugin(),
      TimerPlugin(),
      CalendarPlugin(),
      JsonPlugin({ surface: 'atom' }),
      MarkdownPlugin({ surface: 'atom' }),
      VideoPlugin(),
      YouTubeVideoPlugin(),
      PDFEmbedPlugin(),
      FileUploadPlugin(),
      FormBuilderPlugin(),
      BlockPlugin(),
    ]);
    for (const node of [
      'chart',
      'timer',
      'calendar',
      'json_embed',
      'md_embed',
      'video',
      'youtube',
      'pdf',
      'file',
      'form',
      'block_container',
    ]) {
      expect(map.has(node)).toBe(true);
    }
  });

  it('docToPublishedHTML uses chart publisher map', () => {
    expect.hasAssertions();
    const pubs = collectPublishNodes([ChartsPlugin()]);
    const html = docToPublishedHTML(
      {
        type: 'doc',
        content: [
          {
            type: 'chart',
            attrs: {
              chartType: 'bar',
              data: [{ name: 'S', data: [{ label: 'A', value: 1 }] }],
              title: 'T',
              width: 200,
              height: 100,
            },
          },
        ],
      },
      pubs
    );
    expect(html).toContain('ocm-chart-publish');
    expect(
      docToHTML({
        type: 'doc',
        content: [{ type: 'chart', attrs: { chartType: 'bar', data: [] } }],
      })
    ).toMatch(/data-node="chart"/);
  });
});
