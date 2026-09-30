/**
 * Run `publint --strict` for publishable packages.
 *
 * Usage:
 *   node scripts/publint-all.mjs           # scoped packages only
 *   node scripts/publint-all.mjs --with-root  # + on-codemerge (needs root dist/)
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const withRoot = process.argv.includes('--with-root');

const packages = [
  'packages/kernel',
  'packages/sdk',
  'packages/hunspell',
  'packages/collaboration-server',
  ...(withRoot ? ['.'] : []),
];

let failed = false;

for (const rel of packages) {
  const cwd = resolve(root, rel);
  const label = rel === '.' ? 'on-codemerge' : rel;
  console.log(`\n[publint] ${label}`);

  if (
    (rel === 'packages/kernel' || rel === 'packages/sdk' || rel === 'packages/hunspell') &&
    !existsSync(resolve(cwd, 'dist'))
  ) {
    console.error(`[publint] missing ${rel}/dist — run pnpm run build:packages first`);
    failed = true;
    continue;
  }
  if (rel === '.' && !existsSync(resolve(cwd, 'dist'))) {
    console.error('[publint] missing root dist/ — run pnpm run build first');
    failed = true;
    continue;
  }

  const r = spawnSync('pnpm', ['exec', 'publint', '--strict'], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (r.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('\n[publint] ok');
