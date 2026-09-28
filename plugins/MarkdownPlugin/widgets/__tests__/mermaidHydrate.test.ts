import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseSafeSvg } from '@ocm/wysiwyg/utils/safeHtml';
import { renderMarkdownPreviewHtml } from '../../io/preview';
import { hydrateMermaidBlocks } from '../mermaidHydrate';

const FO_LABEL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><g class="node"><foreignObject width="50" height="20"><div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">Source</span></div></foreignObject></g></svg>';

const render = vi.fn(() =>
  Promise.resolve({
    svg: FO_LABEL_SVG,
  })
);

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: (...args: unknown[]) => render(...args),
  },
}));

describe('hydrateMermaidBlocks', () => {
  beforeEach(() => {
    render.mockClear();
  });

  it('replaces mermaid host with inline SVG (data-node retained)', async () => {
    const root = document.createElement('div');
    root.innerHTML = renderMarkdownPreviewHtml('```mermaid\nflowchart LR\n  A-->B\n```\n');
    document.body.append(root);
    const host = root.querySelector('[data-node="mermaid"]');
    expect(host).toBeTruthy();
    expect(root.querySelector('svg')).toBeNull();

    await hydrateMermaidBlocks(root);

    expect(render).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('flowchart'));
    expect(root.querySelector('iframe')).toBeNull();
    const svg = root.querySelector('svg[data-node="mermaid"]');
    expect(svg).toBeInstanceOf(SVGElement);
    expect(svg?.getAttribute('data-ocm-mermaid-ready')).toBe('1');
    expect(host?.getAttribute('data-ocm-mermaid-ready')).toBe('1');
    root.remove();
  });

  it('skips re-render when data-source hash unchanged', async () => {
    const root = document.createElement('div');
    root.innerHTML = renderMarkdownPreviewHtml('```mermaid\nflowchart LR\n  A-->B\n```\n');
    document.body.append(root);
    await hydrateMermaidBlocks(root);
    expect(render).toHaveBeenCalledTimes(1);
    const host = root.querySelector<HTMLElement>('[data-node="mermaid"]');
    host?.removeAttribute('data-ocm-mermaid-ready');
    await hydrateMermaidBlocks(root);
    expect(render).toHaveBeenCalledTimes(1);
    root.remove();
  });

  it('parseSafeSvg keeps foreignObject node labels', () => {
    const svg = parseSafeSvg(FO_LABEL_SVG);
    expect(svg?.textContent ?? '').toContain('Source');
    expect(svg?.querySelector('foreignObject')).toBeTruthy();
    expect(svg?.querySelector('.nodeLabel')?.textContent).toBe('Source');
  });

  it('parseSafeSvg strips script and on* handlers', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><text onclick="evil()">A</text></svg>';
    const svg = parseSafeSvg(dirty);
    expect(svg?.querySelector('script')).toBeNull();
    expect(svg?.querySelector('text')?.getAttribute('onclick')).toBeNull();
    expect(svg?.textContent ?? '').toContain('A');
  });

  it('hydrate keeps label text from foreignObject SVG', async () => {
    const root = document.createElement('div');
    root.innerHTML = renderMarkdownPreviewHtml('```mermaid\nflowchart LR\n  A-->B\n```\n');
    document.body.append(root);
    await hydrateMermaidBlocks(root);
    const svg = root.querySelector('svg[data-node="mermaid"]');
    expect(svg?.textContent ?? '').toContain('Source');
    root.remove();
  });
});
