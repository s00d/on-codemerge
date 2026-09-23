/** Register plugin publish runtimes (timer, calendar, …) without auto-booting the document. */
import { publishRuntimes } from '../../packages/sdk/src/publish';
import type { PublishRuntimeDefinition } from '../../packages/sdk/src/publish';

const modules = import.meta.glob<{ runtime: PublishRuntimeDefinition }>(
  '../plugins/*/publish/runtime.ts',
  { eager: true }
);

let registered = false;

/** Idempotent — safe to call from `public.ts` and live preview hosts. */
export function ensurePublishRuntimesRegistered(): void {
  if (registered) {
    return;
  }
  for (const mod of Object.values(modules)) {
    publishRuntimes.register(mod.runtime);
  }
  registered = true;
}

export { publishRuntimes };
