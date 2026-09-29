import { parseSafeSvg } from '@ocm/wysiwyg/utils/safeHtml';
import type { Mermaid } from 'mermaid';

let mermaidPromise: Promise<Mermaid> | null = null;
let renderSeq = 0;

function loadMermaid(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = (async () => {
      const mod = await import('mermaid');
      const api = mod.default;
      api.initialize({
        startOnLoad: false,
        // strict: mermaid escapes label HTML / drops click handlers.
        securityLevel: 'strict',
        theme: 'neutral',
      });
      return api;
    })();
  }
  return mermaidPromise;
}

function readSource(host: HTMLElement): string {
  const fromAttr = host.getAttribute('data-source');
  if (fromAttr !== null && fromAttr !== '') {
    return fromAttr;
  }
  const hash = host.getAttribute('data-ocm-mermaid-hash');
  if (hash !== null && hash !== '') {
    return hash;
  }
  const code = host.querySelector('code.language-mermaid');
  return code?.textContent ?? '';
}

/**
 * Pull already-hydrated mermaid hosts out of the preview before a full DOM replace.
 * Keyed by diagram source so unchanged diagrams skip `mermaid.render`.
 */
export function salvageMermaidHosts(root: HTMLElement): Map<string, HTMLElement> {
  const out = new Map<string, HTMLElement>();
  for (const host of root.querySelectorAll<HTMLElement>(
    'div[data-node="mermaid"][data-ocm-mermaid-ready="1"], .ocm-md-mermaid[data-ocm-mermaid-ready="1"]'
  )) {
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
  for (const host of root.querySelectorAll<HTMLElement>(
    'div[data-node="mermaid"], .ocm-md-mermaid'
  )) {
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
 * Skips hosts whose hash matches an already-rendered SVG.
 */
export async function hydrateMermaidBlocks(
  root: HTMLElement,
  opts: { signal?: AbortSignal } = {}
): Promise<void> {
  // Hosts only (div) — ignore SVG that already carries data-node after hydrate.
  const hosts = [
    ...root.querySelectorAll<HTMLElement>(
      'div[data-node="mermaid"]:not([data-ocm-mermaid-ready]), .ocm-md-mermaid:not([data-ocm-mermaid-ready])'
    ),
  ];
  if (hosts.length === 0) {
    return;
  }
  const mermaid = await loadMermaid();
  if (opts.signal?.aborted) {
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
    host.setAttribute('data-ocm-mermaid-ready', '1');
    if (!source.trim()) {
      continue;
    }
    host.setAttribute('data-ocm-mermaid-hash', source);
    try {
      renderSeq += 1;
      const id = `ocm-mmd-${renderSeq}`;
      const { svg } = await mermaid.render(id, source);
      if (opts.signal?.aborted) {
        return;
      }
      const svgEl = parseSafeSvg(svg);
      if (!svgEl) {
        host.setAttribute('data-ocm-mermaid-error', '1');
        continue;
      }
      svgEl.setAttribute('data-node', 'mermaid');
      svgEl.setAttribute('data-ocm-mermaid-ready', '1');
      svgEl.classList.add('ocm-md-mermaid__svg');
      host.replaceChildren(svgEl);
    } catch {
      host.setAttribute('data-ocm-mermaid-error', '1');
    }
  }
}
