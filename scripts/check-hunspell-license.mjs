/**
 * Ensure hunspell SPDX + NOTICE stay aligned (BSD Typo.js lineage).
 * Does not require a full dist build — checks source + package metadata.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkgPath = resolve(root, 'packages/hunspell/package.json');
const noticePath = resolve(root, 'packages/hunspell/NOTICE');

const errors = [];

if (!existsSync(noticePath)) {
  errors.push('missing packages/hunspell/NOTICE');
} else {
  const notice = readFileSync(noticePath, 'utf8');
  if (!notice.includes('Typo.js') || !notice.includes('BSD')) {
    errors.push('packages/hunspell/NOTICE must mention Typo.js + BSD');
  }
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (typeof pkg.license !== 'string' || !pkg.license.includes('BSD-3-Clause')) {
  errors.push(
    `packages/hunspell/package.json license must include BSD-3-Clause (got ${JSON.stringify(pkg.license)})`
  );
}
if (!Array.isArray(pkg.files) || !pkg.files.includes('NOTICE')) {
  errors.push('packages/hunspell/package.json files[] must include NOTICE');
}
if (!Array.isArray(pkg.files) || !pkg.files.includes('dist')) {
  errors.push('packages/hunspell/package.json files[] must include dist (publishable layout)');
}
if (pkg.private === true) {
  errors.push('packages/hunspell/package.json must not be private (published package)');
}

if (errors.length > 0) {
  console.error('check-hunspell-license failed:');
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log('check-hunspell-license: ok');
