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
  const code = host.querySelector('code.language-mermaid');
  return code?.textContent ?? '';
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
