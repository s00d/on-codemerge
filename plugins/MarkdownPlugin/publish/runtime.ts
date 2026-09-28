import { definePublishRuntime } from '@on-codemerge/sdk';
import { hydrateMermaidBlocks } from '../widgets/mermaidHydrate';

/** Published md_embed — hydrate mermaid hosts into inline SVG (data-node). */
export const runtime = definePublishRuntime({
  id: 'md-mermaid',
  mount(el) {
    const ac = new AbortController();
    void hydrateMermaidBlocks(el, { signal: ac.signal });
    return () => {
      ac.abort();
    };
  },
});
