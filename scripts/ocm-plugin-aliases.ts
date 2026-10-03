import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Map `@ocm/<name>-plugin` → `plugins/<Folder>` for Vite resolve
 * (root does not list every private plugin as a dependency).
 */
export function ocmPluginAliases(root: string): Record<string, string> {
  const aliases: Record<string, string> = {};
  const pluginsDir = resolve(root, 'plugins');
  if (!existsSync(pluginsDir)) {
    return aliases;
  }
  for (const name of readdirSync(pluginsDir).toSorted()) {
    const dir = resolve(pluginsDir, name);
    const pkgPath = resolve(dir, 'package.json');
    if (!existsSync(pkgPath)) {
      continue;
    }
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
      if (typeof pkg.name === 'string' && pkg.name.startsWith('@ocm/')) {
        aliases[pkg.name] = dir;
      }
    } catch {
      /* ignore */
    }
  }
  return aliases;
}
