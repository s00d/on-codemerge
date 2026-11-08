/** Published page JS (pair with public.css) -> dist/public.js. */
import { publishRuntimes } from '@codemerge/sdk';
import { ensurePublishRuntimesRegistered } from './publish/runtimes';

ensurePublishRuntimesRegistered();

function boot(): void {
  publishRuntimes.boot(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
