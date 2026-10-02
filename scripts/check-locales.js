#!/usr/bin/env node
/**
 * Ensure every non-en locale in each i18n pack shares that pack's en.json key tree.
 * Packs: packages/editor/src/i18n/locales + plugins/<Name>Plugin/i18n/locales
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function flatten(obj, prefix = '', out = {}) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out[prefix] = obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function findLocaleDirs(dir, out = []) {
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.name === 'locales' && path.basename(path.dirname(full)) === 'i18n') {
      out.push(full);
      continue;
    }
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue;
    }
    findLocaleDirs(full, out);
  }
  return out;
}

const packs = [
  path.join(root, 'packages/editor/src/i18n/locales'),
  ...findLocaleDirs(path.join(root, 'plugins')),
]
  .filter((d) => fs.existsSync(d) && fs.existsSync(path.join(d, 'en.json')))
  .toSorted((a, b) => a.localeCompare(b));

if (packs.length === 0) {
  console.error('check-locales: no locale packs found');
  process.exit(1);
}

let failed = false;

for (const localesDir of packs) {
  const label = path.relative(root, localesDir);
  const enPath = path.join(localesDir, 'en.json');
  const enKeys = Object.keys(flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')))).toSorted(
    (a, b) => a.localeCompare(b)
  );
  const files = fs
    .readdirSync(localesDir)
    .filter((f) => f.endsWith('.json') && f !== 'en.json')
    .toSorted((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    failed = true;
    console.error(`check-locales: ${label}: no non-en locale files`);
    continue;
  }

  for (const file of files) {
    const code = file.replace(/\.json$/, '');
    const keys = Object.keys(
      flatten(JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8')))
    ).toSorted((a, b) => a.localeCompare(b));
    const missing = enKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !enKeys.includes(k));
    if (missing.length > 0 || extra.length > 0) {
      failed = true;
      console.error(`check-locales: ${label} ${code} key mismatch`);
      if (missing.length > 0) {
        console.error(
          `  missing (${missing.length}):`,
          missing.slice(0, 20).join(', '),
          missing.length > 20 ? '…' : ''
        );
      }
      if (extra.length > 0) {
        console.error(
          `  extra (${extra.length}):`,
          extra.slice(0, 20).join(', '),
          extra.length > 20 ? '…' : ''
        );
      }
    } else {
      console.log(`check-locales: ${label} ${code} OK (${keys.length} keys)`);
    }
  }
  console.log(`check-locales: ${label} en baseline ${enKeys.length} keys`);
}

if (failed) {
  process.exit(1);
}
console.log(`check-locales: ${packs.length} packs — all locales match`);
