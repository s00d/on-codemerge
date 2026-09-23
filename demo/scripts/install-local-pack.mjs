#!/usr/bin/env node
/**
 * Build monorepo → pnpm pack → point demo at the tarball → pnpm install.
 * Use before 2.0.1 is on the registry (or to retest a local build).
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const demoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(demoDir, '..');

console.log('→ build package in repo root');
execSync('pnpm run build', { cwd: root, stdio: 'inherit' });

for (const f of readdirSync(root)) {
  if (/^on-codemerge-.*\.tgz$/.test(f)) rmSync(join(root, f));
}
for (const f of readdirSync(demoDir)) {
  if (/^on-codemerge-.*\.tgz$/.test(f)) rmSync(join(demoDir, f));
}

console.log('→ pnpm pack');
execSync('pnpm pack', { cwd: root, stdio: 'inherit' });

const tgz = readdirSync(root).find((f) => /^on-codemerge-.*\.tgz$/.test(f));
if (!tgz) throw new Error('no on-codemerge-*.tgz after pnpm pack');

cpSync(join(root, tgz), join(demoDir, tgz));
rmSync(join(root, tgz));
console.log(`→ demo/${tgz}`);

const pkgPath = join(demoDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.dependencies = pkg.dependencies ?? {};
pkg.dependencies['on-codemerge'] = `file:./${tgz}`;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('→ pnpm install --ignore-workspace');
execSync('pnpm install --ignore-workspace', { cwd: demoDir, stdio: 'inherit' });

console.log('done. Run: pnpm dev   /   pnpm build && pnpm test:e2e');
