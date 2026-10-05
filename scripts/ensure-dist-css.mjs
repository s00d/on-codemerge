#!/usr/bin/env node
/**
 * Docs theme imports dist/index.css + dist/public.css. Rebuild when missing
 * so `pnpm docs:dev` does not die on a clean tree / wiped dist.
 */
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const need = ['dist/index.css', 'dist/public.css'].filter((p) => !existsSync(resolve(root, p)));
if (need.length === 0) {
  process.exit(0);
}

console.log(`[ensure-dist-css] missing ${need.join(', ')} — building styles`);
execFileSync('pnpm', ['exec', 'vite', 'build', '--config', 'vite.styles.config.ts'], {
  cwd: root,
  stdio: 'inherit',
});
execFileSync('pnpm', ['exec', 'vite', 'build', '--config', 'apps/wysiwyg/vite.public.config.ts'], {
  cwd: root,
  stdio: 'inherit',
});
