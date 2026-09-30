/**
 * Build a publishable `@codemerge/*` package via Vite (supports multi-entry).
 * Usage (from package dir): `tsx ../../scripts/build-published-package.mjs`
 * Loads `./vite.lib.config.ts` which must default-export PublishedLibOptions.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'vite';
import { createPublishedLibConfigs } from './create-published-lib-config.ts';

const configPath = resolve(process.cwd(), process.argv[2] ?? 'vite.lib.config.ts');
const mod = await import(pathToFileURL(configPath).href);
const opts = mod.default;

if (!opts?.packageDir || !opts?.entries) {
  console.error(
    'vite.lib.config.ts must default-export { packageDir, entries, ... } (PublishedLibOptions)'
  );
  process.exit(1);
}

const configs = createPublishedLibConfigs(opts);
for (const [i, config] of configs.entries()) {
  console.log(`[published-lib] build ${i + 1}/${configs.length}`);
  await build({
    ...config,
    configFile: false,
  });
}

console.log('[published-lib] done');
