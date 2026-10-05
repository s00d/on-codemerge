import { render as renderMermaidSvg } from '@codemerge/mermaid';
import { mountTrustedSvg } from '@codemerge/sdk';

export const MERMAID_HOST_SEL = 'div[data-node="mermaid"], .ocm-md-mermaid';
export const MERMAID_PENDING_SEL =
  'div[data-node="mermaid"]:not([data-ocm-mermaid-ready]), .ocm-md-mermaid:not([data-ocm-mermaid-ready])';
export const MERMAID_READY_SEL =
  'div[data-node="mermaid"][data-ocm-mermaid-ready="1"], .ocm-md-mermaid[data-ocm-mermaid-ready="1"]';

function readSource(host: HTMLElement): string {
  const hash = host.getAttribute('data-ocm-mermaid-hash');
  if (hash !== null && hash !== '') {
    return hash;
  }
  const code = host.querySelector('code.language-mermaid');
  return code?.textContent ?? '';
}

/**
 * Pull already-hydrated mermaid hosts out of the preview before a full DOM replace.
 * Keyed by diagram source so unchanged diagrams skip re-render.
 */
export function salvageMermaidHosts(root: HTMLElement): Map<string, HTMLElement> {
  const out = new Map<string, HTMLElement>();
  for (const host of root.querySelectorAll<HTMLElement>(MERMAID_READY_SEL)) {
    const source = readSource(host);
    if (!source.trim() || !host.querySelector('svg')) {
      continue;
    }
    out.set(source, host);
  }
  return out;
}

/**
 * Swap fresh projector hosts for salvaged hydrated hosts when the source matches.
 */
export function restoreMermaidHosts(root: HTMLElement, salvaged: Map<string, HTMLElement>): void {
  if (salvaged.size === 0) {
    return;
  }
  for (const host of root.querySelectorAll<HTMLElement>(MERMAID_HOST_SEL)) {
    if (host.hasAttribute('data-ocm-mermaid-ready')) {
      continue;
    }
    const source = readSource(host);
    const prev = salvaged.get(source);
    if (!prev) {
      continue;
    }
    salvaged.delete(source);
    host.replaceWith(prev);
  }
}

/**
 * Turn `[data-node="mermaid"]` hosts into inline SVG (parent DOM) with data-node retained.
 * Sync — `@codemerge/mermaid` render is sync; SVG is trusted (escaped at emit).
 */
export function hydrateMermaidBlocks(root: HTMLElement, opts: { signal?: AbortSignal } = {}): void {
  const hosts = [...root.querySelectorAll<HTMLElement>(MERMAID_PENDING_SEL)];
  if (hosts.length === 0) {
    return;
  }

  for (const host of hosts) {
    if (opts.signal?.aborted) {
      return;
    }
    const source = readSource(host);
    const prev = host.getAttribute('data-ocm-mermaid-hash');
    // After SVG replaceChildren, code DOM is gone — keep SVG when hash matches or source unreadable.
    if (prev !== null && host.querySelector('svg') && (source === '' || prev === source)) {
      host.setAttribute('data-ocm-mermaid-ready', '1');
      continue;
    }
    if (!source.trim()) {
      host.setAttribute('data-ocm-mermaid-ready', '1');
      continue;
    }
    host.setAttribute('data-ocm-mermaid-hash', source);
    try {
      const svg = renderMermaidSvg(source);
      if (opts.signal?.aborted) {
        return;
      }
      const svgEl = mountTrustedSvg(svg);
      if (!svgEl) {
        host.setAttribute('data-ocm-mermaid-error', '1');
        continue;
      }
      svgEl.setAttribute('data-node', 'mermaid');
      svgEl.setAttribute('data-ocm-mermaid-ready', '1');
      svgEl.classList.add('ocm-md-mermaid__svg');
      host.replaceChildren(svgEl);
      host.setAttribute('data-ocm-mermaid-ready', '1');
    } catch {
      host.setAttribute('data-ocm-mermaid-error', '1');
    }
  }
}
