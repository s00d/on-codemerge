import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** `@ocm/plugins` + `@ocm/*-plugin` → `plugins/` folders (private workspace packages). */
export function ocmPluginAliases(root: string): Record<string, string> {
  const aliases: Record<string, string> = {};
  const pluginsDir = resolve(root, 'plugins');
  if (!existsSync(pluginsDir)) {
    return aliases;
  }
  const add = (dir: string): void => {
    const pkgPath = resolve(dir, 'package.json');
    if (!existsSync(pkgPath)) {
      return;
    }
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
      if (typeof pkg.name === 'string' && pkg.name.startsWith('@ocm/')) {
        aliases[pkg.name] = dir;
      }
    } catch {
      /* ignore */
    }
  };
  add(pluginsDir);
  for (const name of readdirSync(pluginsDir).toSorted()) {
    add(resolve(pluginsDir, name));
  }
  return aliases;
}
