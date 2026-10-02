#!/usr/bin/env node
/**
 * Runtime contract: `on-codemerge/calendar` resolves to dist via package exports.
 * Run after `pnpm build`.
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const expectedEsm = resolve(root, 'dist/calendar.mjs');
const parent = pathToFileURL(resolve(root, 'package.json')).href;

const esmUrl = import.meta.resolve('on-codemerge/calendar', parent);
const esmPath = fileURLToPath(esmUrl);
if (resolve(esmPath) !== expectedEsm) {
  console.error('[check-calendar-export] ESM resolve expected dist/calendar.mjs, got', esmPath);
  process.exit(1);
}
if (!existsSync(esmPath)) {
  console.error('[check-calendar-export] missing', esmPath, '(run pnpm build)');
  process.exit(1);
}

const esm = await import(esmUrl);
if (typeof esm.Editor !== 'function') {
  console.error('[check-calendar-export] ESM Editor not a function');
  process.exit(1);
}

const req = createRequire(resolve(root, 'package.json'));
const cjs = req('on-codemerge/calendar');
if (typeof cjs.Editor !== 'function') {
  console.error('[check-calendar-export] CJS Editor not a function');
  process.exit(1);
}

console.log('[check-calendar-export] ok', esmPath);
