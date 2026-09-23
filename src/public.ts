/** Published page JS (pair with public.css) -> dist/public.js. */
import { ensurePublishRuntimesRegistered, publishRuntimes } from './publish/runtimes';

ensurePublishRuntimesRegistered();

function boot(): void {
  publishRuntimes.boot(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
