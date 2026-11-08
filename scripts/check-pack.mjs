#!/usr/bin/env node
/**
 * Tarball gate for every publishable package (run after all builds).
 * Packs each package exactly as `pnpm publish` would, then checks the tarball:
 *  - every `exports` / `main` / `module` / `types` / `bin` target is inside it;
 *  - no `workspace:` / `catalog:` specifiers survive in the packed package.json;
 *  - no tests, fixtures or source maps of tests leak in;
 *  - types resolve for ESM + CJS consumers (`attw`, node16 + bundler);
 *  - a consumer project importing every typed entrypoint of the unpacked tarballs passes
 *    `tsc` with `skipLibCheck: false` under nodenext and bundler (catches broken or cyclic
 *    declarations that attw only resolves, never checks).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
// Inside the repo so third-party types (and installed optional peers) resolve from the root
// node_modules, while our own packages resolve from the unpacked tarballs next to it.
const consumer = resolve(root, 'node_modules/.cache/ocm-pack-consumer');
rmSync(consumer, { recursive: true, force: true });
const entrypoints = [];
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

    const into = resolve(consumer, 'node_modules', pkg.name);
    mkdirSync(into, { recursive: true });
    run('tar', ['-xzf', tgz, '-C', into, '--strip-components', '1'], out);
    for (const [key, value] of Object.entries(pkg.exports ?? {})) {
      if (JSON.stringify(value).includes('"types"')) {
        entrypoints.push(`${pkg.name}${key.slice(1)}`);
      }
    }

    console.log(`ok ${label} (${files.size} files)`);
  }

  // Own package.json: otherwise the repo root's `on-codemerge` would satisfy imports of
  // `on-codemerge` as a self-reference instead of the unpacked tarball.
  writeFileSync(
    resolve(consumer, 'package.json'),
    JSON.stringify({ name: 'ocm-pack-consumer', private: true, type: 'module' })
  );
  writeFileSync(
    resolve(consumer, 'index.ts'),
    `${entrypoints.map((e, i) => `import type * as e${i} from '${e}';`).join('\n')}\nexport type All = [${entrypoints.map((_, i) => `typeof e${i}`).join(', ')}];\n`
  );
  const ours = new Set(
    PACKAGES.map((d) => JSON.parse(readFileSync(resolve(root, d, 'package.json'), 'utf8')).name)
  );
  for (const [module, moduleResolution] of [
    ['nodenext', 'nodenext'],
    ['esnext', 'bundler'],
  ]) {
    writeFileSync(
      resolve(consumer, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module,
          moduleResolution,
          target: 'es2022',
          lib: ['es2022', 'dom', 'dom.iterable'],
          types: ['node'],
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        files: ['index.ts'],
      })
    );
    let output = '';
    try {
      run(resolve(root, 'node_modules/.bin/tsc'), ['-p', consumer], root);
    } catch (e) {
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }
    // An optional peer that is not installed here (react, vue, …) is the consumer's business.
    const real = output
      .split('\n')
      .filter((line) => /error TS/.test(line))
      .filter((line) => {
        const missing = line.match(/TS2307: Cannot find module '([^']+)'/);
        if (!missing) {
          return true;
        }
        const name = missing[1].startsWith('@')
          ? missing[1].split('/').slice(0, 2).join('/')
          : missing[1].split('/')[0];
        return ours.has(name) || missing[1].startsWith('.');
      });
    if (real.length > 0) {
      errors.push(`consumer tsc (${moduleResolution}) failed:\n${real.slice(0, 40).join('\n')}`);
    } else {
      console.log(`ok consumer tsc (${moduleResolution}, ${entrypoints.length} entrypoints)`);
    }
  }
} finally {
  rmSync(out, { recursive: true, force: true });
  rmSync(consumer, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error(`\ncheck-pack: ${errors.length} problem(s)\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('check-pack: all tarballs OK');
