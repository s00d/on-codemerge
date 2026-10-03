#!/usr/bin/env node
/**
 * Post-build hygiene for the publishable monolith dist.
 * Run after `pnpm build` (same class as check-public-bundle).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
if (pkg.imports && typeof pkg.imports === 'object') {
  for (const [key, target] of Object.entries(pkg.imports)) {
    if (typeof target === 'string' && target.endsWith('.ts')) {
      errors.push(`package.json imports["${key}"] points at source ${target} (not shippable)`);
    }
  }
}

if (pkg.exports && pkg.exports['./plugins/*/style.css']) {
  errors.push('package.json must not export ./plugins/*/style.css — use on-codemerge/index.css');
}

if (pkg.exports && pkg.exports['./sdk.css']) {
  errors.push('package.json must not export ./sdk.css — use @codemerge/sdk/sdk.css');
}

if (existsSync(resolve(root, 'dist/packages/mermaid'))) {
  errors.push(
    'dist/packages/mermaid must not ship (external @codemerge/mermaid; exclude from dts)'
  );
}

if (existsSync(resolve(root, 'dist/plugins/ToolbarDividerPlugin'))) {
  errors.push('dist/plugins/ToolbarDividerPlugin must not ship (plugin removed)');
}

if (existsSync(resolve(root, 'dist/node_modules'))) {
  errors.push('dist/node_modules must not ship (deps are package.json externals)');
}

for (const name of ['tailwind.css', 'public.css', 'index.css']) {
  const nested = resolve(root, 'dist/apps/wysiwyg/src', name);
  if (existsSync(nested)) {
    errors.push(`nested CSS must not ship: dist/apps/wysiwyg/src/${name}`);
  }
}

for (const name of ['index.css', 'public.css', 'tailwind.css', 'public.js', 'app.mjs']) {
  if (!existsSync(resolve(root, 'dist', name))) {
    errors.push(`missing dist/${name}`);
  }
}

if (existsSync(resolve(root, 'dist/packages/sdk/src/ui/sdk.css'))) {
  errors.push(
    'dist/packages/sdk/src/ui/sdk.css must not ship — use @codemerge/sdk/sdk.css / index.css'
  );
}

/** No per-plugin style.css in publishable dist (bundled into index.css). */
const distPlugins = resolve(root, 'dist/plugins');
if (existsSync(distPlugins)) {
  for (const name of readdirSync(distPlugins)) {
    if (existsSync(resolve(distPlugins, name, 'style.css'))) {
      errors.push(`dist/plugins/${name}/style.css must not ship — use on-codemerge/index.css`);
    }
  }
}

/** Every plugin `./style.scss` export must appear in the generated package-index source. */
const { buildPackageIndexCss, listPluginStylePackages } = await import(
  pathToFileURL(resolve(root, 'scripts/ocm-package-index-css.ts')).href
);
const generated = buildPackageIndexCss(root);
const stylePkgs = listPluginStylePackages(root);
if (stylePkgs.length === 0) {
  errors.push('no plugin style.scss exports found — unexpected');
}
for (const { name } of stylePkgs) {
  if (!generated.includes(`@import '${name}/style.scss'`)) {
    errors.push(`generated package-index missing @import for ${name}/style.scss`);
  }
}

function walkJs(dir, visit) {
  let dirents;
  try {
    dirents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of dirents) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) {
      walkJs(path, visit);
      continue;
    }
    if (ent.name.endsWith('.mjs') || ent.name.endsWith('.cjs')) {
      visit(path);
    }
  }
}

const distDir = resolve(root, 'dist');
if (existsSync(distDir)) {
  walkJs(distDir, (path) => {
    const src = readFileSync(path, 'utf8');
    if (src.includes('/* empty css')) {
      errors.push(`Vite empty-css placeholder in ${path.slice(root.length + 1)}`);
    }
    if (src.includes('__vite-browser-external')) {
      errors.push(`__vite-browser-external stub in ${path.slice(root.length + 1)}`);
    }
  });
}

if (errors.length > 0) {
  console.error('[check-dist-package] failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log(`[check-dist-package] ok (${stylePkgs.length} plugin styles in virtual index)`);
