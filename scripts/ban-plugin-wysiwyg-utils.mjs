#!/usr/bin/env node
/**
 * Plugins must not import platform helpers from apps/wysiwyg.
 * Use @codemerge/sdk / @codemerge/kernel / @codemerge/view instead.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', 'plugins');
const BANNED = [/from\s+['"]@ocm\/wysiwyg\/utils(\/|['"])/, /from\s+['"]@ocm\/wysiwyg\/icons['"]/];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') {
        continue;
      }
      walk(p, out);
    } else if (/\.(ts|tsx|js|mjs)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const hits = [];
for (const file of walk(root)) {
  const src = readFileSync(file, 'utf8');
  if (BANNED.some((re) => re.test(src))) {
    hits.push(relative(join(import.meta.dirname, '..'), file));
  }
}

if (hits.length > 0) {
  console.error('ban-plugin-wysiwyg-utils: plugins must not import @ocm/wysiwyg/{utils,icons}:');
  for (const h of hits) {
    console.error(`  ${h}`);
  }
  process.exit(1);
}
console.log('ban-plugin-wysiwyg-utils: ok');
