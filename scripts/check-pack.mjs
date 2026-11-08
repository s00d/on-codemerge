#!/usr/bin/env node
/**
 * Tarball gate for every publishable package (run after all builds).
 * Packs each package exactly as `pnpm publish` would, then checks the tarball:
 *  - every `exports` / `main` / `module` / `types` / `bin` target is inside it;
 *  - no `workspace:` / `catalog:` specifiers survive in the packed package.json;
 *  - no tests, fixtures or source maps of tests leak in;
 *  - types resolve for ESM + CJS consumers (`attw`, node16 + bundler).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES = [
  'packages/kernel',
  'packages/view',
  'packages/mermaid',
  'packages/sdk',
  'packages/hunspell',
  'packages/collaboration-server',
  'packages/integrate',
  '.',
];
const LEAK = /(^|\/)(__tests__|__fixtures__|test|tests)\/|\.(test|spec)\.[cm]?[jt]sx?$/;

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** All string leaves of an `exports`-like value. */
function leaves(value, out = []) {
  if (typeof value === 'string') {
    out.push(value);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) {
      leaves(v, out);
    }
  }
  return out;
}

function hasTarget(files, target) {
  const path = target.replace(/^\.\//, '');
  if (!path.includes('*')) {
    return files.has(path);
  }
  const [head, tail] = path.split('*');
  for (const f of files) {
    if (f.startsWith(head) && f.endsWith(tail)) {
      return true;
    }
  }
  return false;
}

const out = mkdtempSync(join(tmpdir(), 'ocm-pack-'));
const errors = [];
try {
  for (const dir of PACKAGES) {
    const cwd = resolve(root, dir);
    const packed = run('pnpm', ['pack', '--pack-destination', out], cwd).trim().split('\n').pop();
    const tgz = resolve(cwd, packed);
    const files = new Set(
      run('tar', ['-tzf', tgz], out)
        .split('\n')
        .filter(Boolean)
        .map((f) => f.replace(/^package\//, ''))
    );
    const pkg = JSON.parse(run('tar', ['-xzOf', tgz, 'package/package.json'], out));
    const label = `${pkg.name}@${pkg.version}`;

    const targets = [
      ...leaves(pkg.exports),
      ...leaves(pkg.bin),
      ...[pkg.main, pkg.module, pkg.types, pkg.typings].filter(Boolean),
    ];
    for (const t of new Set(targets)) {
      if (!hasTarget(files, t)) {
        errors.push(`${label}: target ${t} missing from tarball`);
      }
    }

    const raw = JSON.stringify(pkg);
    for (const proto of ['workspace:', 'catalog:']) {
      if (raw.includes(`"${proto}`)) {
        errors.push(`${label}: packed package.json still has ${proto}`);
      }
    }

    for (const f of files) {
      if (LEAK.test(f)) {
        errors.push(`${label}: test file leaked into tarball: ${f}`);
      }
    }

    // Entrypoints without a `types` condition are assets (CSS, SCSS, .svelte, the published
    // page script), not typed modules — attw would only report them as unresolvable.
    const assets = Object.entries(pkg.exports ?? {})
      .filter(
        ([key, value]) => key !== './package.json' && !JSON.stringify(value).includes('"types"')
      )
      .map(([key]) => key);
    try {
      run(
        'pnpm',
        [
          'exec',
          'attw',
          tgz,
          '--profile',
          'node16',
          '--format',
          'ascii',
          ...(assets.length > 0 ? ['--exclude-entrypoints', ...assets] : []),
        ],
        root
      );
    } catch (e) {
      errors.push(`${label}: attw failed\n${e.stdout ?? ''}${e.stderr ?? ''}`);
    }

    console.log(`ok ${label} (${files.size} files)`);
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error(`\ncheck-pack: ${errors.length} problem(s)\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('check-pack: all tarballs OK');
