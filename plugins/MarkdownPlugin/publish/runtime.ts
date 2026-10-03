import { definePublishRuntime } from '@codemerge/sdk';
import { hydrateMermaidBlocks } from '../widgets/mermaidHydrate';

/** Published md_embed — hydrate mermaid hosts via `@codemerge/mermaid` (bundled in public.js). */
export const runtime = definePublishRuntime({
  id: 'md-mermaid',
  mount(el) {
    const ac = new AbortController();
    hydrateMermaidBlocks(el, { signal: ac.signal });
    return () => {
      ac.abort();
    };
  },
});
