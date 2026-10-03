import { describe, expect, it } from 'vitest';
import { renderMarkdownPreviewHtml } from '../../io/preview';
import { hydrateMermaidBlocks, restoreMermaidHosts, salvageMermaidHosts } from '../mermaidHydrate';

describe('hydrateMermaidBlocks', () => {
  it('replaces mermaid host with real SVG and sets ready only after success', () => {
    const root = document.createElement('div');
    root.innerHTML = renderMarkdownPreviewHtml('```mermaid\nflowchart LR\n  A-->B\n```\n');
    document.body.append(root);
    const host = root.querySelector('[data-node="mermaid"]');
    expect(host).toBeTruthy();

    hydrateMermaidBlocks(root);

    const svg = root.querySelector('svg[data-node="mermaid"]');
    expect(svg).toBeInstanceOf(SVGElement);
    expect(svg?.getAttribute('data-ocm-mermaid-ready')).toBe('1');
    expect(host?.getAttribute('data-ocm-mermaid-ready')).toBe('1');
    expect(host?.hasAttribute('data-ocm-mermaid-error')).toBe(false);
    expect(svg?.querySelector('path, rect, text')).toBeTruthy();
    expect(svg?.querySelector('marker')?.getAttribute('markerWidth')).toBeTruthy();
    expect(svg?.querySelector('path[marker-end]')).toBeTruthy();
    expect(svg?.outerHTML ?? '').not.toContain('<style');
    root.remove();
  });

  it('skips re-render when hash unchanged', () => {
    const root = document.createElement('div');
    root.innerHTML = renderMarkdownPreviewHtml('```mermaid\nflowchart LR\n  A-->B\n```\n');
    document.body.append(root);
    hydrateMermaidBlocks(root);
    const svgBefore = root.querySelector('svg')?.outerHTML;
    const host = root.querySelector<HTMLElement>('[data-node="mermaid"]');
    host?.removeAttribute('data-ocm-mermaid-ready');
    hydrateMermaidBlocks(root);
    expect(root.querySelector('svg')?.outerHTML).toBe(svgBefore);
    root.remove();
  });

  it('marks unsupported diagram with error and leaves ready unset', () => {
    const root = document.createElement('div');
    root.innerHTML = renderMarkdownPreviewHtml('```mermaid\ngitGraph\n  commit\n```\n');
    document.body.append(root);
    hydrateMermaidBlocks(root);
    const host = root.querySelector<HTMLElement>('[data-node="mermaid"]');
    expect(host?.getAttribute('data-ocm-mermaid-error')).toBe('1');
    expect(host?.hasAttribute('data-ocm-mermaid-ready')).toBe(false);
    expect(root.querySelector('svg')).toBeNull();
    root.remove();
  });

  it('hydrates multiple hosts under budget', () => {
    const root = document.createElement('div');
    const block = renderMarkdownPreviewHtml('```mermaid\nflowchart LR\n  A-->B\n```\n');
    root.innerHTML = block + block + block + block + block;
    document.body.append(root);
    const t0 = performance.now();
    hydrateMermaidBlocks(root);
    const ms = performance.now() - t0;
    expect(root.querySelectorAll('svg[data-ocm-mermaid-ready="1"]')).toHaveLength(5);
    expect(ms).toBeLessThan(100);
    root.remove();
  });

  it('salvages and restores hydrated hosts across DOM replace', () => {
    const root = document.createElement('div');
    const md = '```mermaid\nflowchart LR\n  A-->B\n```\n';
    root.innerHTML = renderMarkdownPreviewHtml(md);
    document.body.append(root);
    hydrateMermaidBlocks(root);
    const svgBefore = root.querySelector('svg')?.outerHTML;
    const salvaged = salvageMermaidHosts(root);
    expect(salvaged.size).toBe(1);
    root.innerHTML = renderMarkdownPreviewHtml(md);
    restoreMermaidHosts(root, salvaged);
    expect(root.querySelector('svg')?.outerHTML).toBe(svgBefore);
    expect(root.querySelector('[data-ocm-mermaid-ready="1"]')).toBeTruthy();
    root.remove();
  });
});
