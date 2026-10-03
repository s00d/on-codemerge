import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type PluginStylePkg = { folder: string; name: string };

/** Plugins that export `./style.scss` (sorted by package name). */
export function listPluginStylePackages(root: string): PluginStylePkg[] {
  const pluginsDir = resolve(root, 'plugins');
  const out: PluginStylePkg[] = [];
  if (!existsSync(pluginsDir)) {
    return out;
  }
  for (const folder of readdirSync(pluginsDir).toSorted()) {
    const pkgPath = join(pluginsDir, folder, 'package.json');
    if (!existsSync(pkgPath)) {
      continue;
    }
    let pkg: { name?: string; exports?: Record<string, string> };
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as typeof pkg;
    } catch {
      continue;
    }
    if (!pkg.exports?.['./style.scss'] || typeof pkg.name !== 'string') {
      continue;
    }
    out.push({ folder, name: pkg.name });
  }
  return out.toSorted((a, b) => a.name.localeCompare(b.name));
}

/**
 * Source for published `dist/index.css` + local preview.
 * Plugin sheets come from each private package's `exports["./style.scss"]` — no hand list.
 *
 * Relative `./tailwind.css` / `./index.scss` so Tailwind `@reference` resolves under
 * `apps/wysiwyg/src` (virtual module is loaded from that directory).
 */
export function buildPackageIndexCss(root: string): string {
  const lines = [
    '/* AUTO: ocm package index — tw + editor chrome + sdk.css + plugin style.scss exports */',
    '',
    "@import './tailwind.css';",
    "@import './index.scss';",
    "@import '@codemerge/sdk/sdk.css';",
    '',
  ];
  for (const { name } of listPluginStylePackages(root)) {
    lines.push(`@import '${name}/style.scss';`);
  }
  lines.push('');
  return lines.join('\n');
}

/** Public import id (dev + styles build entry). */
export const OCM_PACKAGE_INDEX_CSS_ID = 'virtual:ocm-package-index.css';

/** Absolute path used as resolved id (keeps CSS `@reference` rooted in wysiwyg/src). */
export function ocmPackageIndexCssResolvedPath(root: string): string {
  return resolve(root, 'apps/wysiwyg/src/__virtual_ocm_package_index.css');
}
