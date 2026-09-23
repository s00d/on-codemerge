import type { Command, Schema } from '@on-codemerge/kernel';
import { createSchema, registerMark, registerNode, sealSchema } from '@on-codemerge/kernel';
import type { EditorAPI, PluginDefinition, WidgetDefinition } from '@on-codemerge/sdk';
import { createPluginContext } from '@on-codemerge/sdk';
import type { DomTarget } from '@on-codemerge/sdk';

export type EditorHost = EditorAPI;

export type Extension = PluginDefinition;

export type Platform = {
  schema: Schema;
  commands: Map<string, Command>;
  shortcuts: { keys: string; command: string }[];
  widgets: Map<string, WidgetDefinition>;
  cleanups: (() => void)[];
  plugins: Map<string, PluginDefinition>;
};

export function createPlatform(plugins: PluginDefinition[] = []): Platform {
  const schema = createSchema();
  const commands = new Map<string, Command>();
  const shortcuts: { keys: string; command: string }[] = [];
  const widgets = new Map<string, WidgetDefinition>();
  const cleanups: (() => void)[] = [];
  const pluginMap = new Map<string, PluginDefinition>();

  for (const ext of plugins) {
    if (pluginMap.has(ext.name)) {
      throw new Error(`Plugin already registered: ${ext.name}`);
    }
    for (const dep of ext.dependsOn ?? []) {
      if (!pluginMap.has(dep) && !plugins.some((p) => p.name === dep)) {
        throw new Error(`Plugin ${ext.name} depends on missing ${dep}`);
      }
    }
    pluginMap.set(ext.name, ext);
    for (const node of ext.nodes ?? []) {
      registerNode(schema, node);
    }
    for (const mark of ext.marks ?? []) {
      registerMark(schema, mark);
    }
    for (const [name, cmd] of Object.entries(ext.commands ?? {})) {
      if (commands.has(name)) {
        throw new Error(`Command already registered: ${name}`);
      }
      commands.set(name, cmd);
    }
    shortcuts.push(...(ext.shortcuts ?? []));
    for (const hk of ext.hotkeys ?? []) {
      shortcuts.push({ keys: hk.keys, command: hk.command });
    }
    for (const [name, widget] of Object.entries(ext.widgets ?? {})) {
      widgets.set(name, widget);
    }
  }

  sealSchema(schema);
  return { schema, commands, shortcuts, widgets, cleanups, plugins: pluginMap };
}

function runSetup(
  platform: Platform,
  plugin: PluginDefinition,
  editor: EditorAPI,
  resolveTarget: (t: DomTarget) => EventTarget
): void {
  if (!plugin.setup) {
    return;
  }
  const ctx = createPluginContext({
    editor,
    name: plugin.name,
    resolveTarget,
  });
  plugin.setup(ctx);
  platform.cleanups.push(() => {
    ctx.scope.dispose();
  });
}

function defaultResolveTarget(editor: EditorAPI, target: DomTarget): EventTarget {
  if (target === 'host' || target === 'chrome') {
    return editor.host;
  }
  // content surface — prefer [contenteditable] inside host
  const content = editor.host.querySelector('[contenteditable="true"]');
  return content ?? editor.host;
}

/** Register additional plugin after initial create. */
export function registerPlugin(
  platform: Platform,
  plugin: PluginDefinition,
  editor: EditorAPI,
  resolveTarget?: (t: DomTarget) => EventTarget
): void {
  if (platform.plugins.has(plugin.name)) {
    throw new Error(`Plugin already registered: ${plugin.name}`);
  }
  for (const dep of plugin.dependsOn ?? []) {
    if (!platform.plugins.has(dep)) {
      throw new Error(`Plugin ${plugin.name} depends on missing ${dep}`);
    }
  }
  for (const [name, cmd] of Object.entries(plugin.commands ?? {})) {
    if (platform.commands.has(name)) {
      throw new Error(`Command already registered: ${name}`);
    }
    platform.commands.set(name, cmd);
  }
  platform.shortcuts.push(...(plugin.shortcuts ?? []));
  for (const hk of plugin.hotkeys ?? []) {
    platform.shortcuts.push({ keys: hk.keys, command: hk.command });
  }
  for (const [name, widget] of Object.entries(plugin.widgets ?? {})) {
    platform.widgets.set(name, widget);
  }
  platform.plugins.set(plugin.name, plugin);
  runSetup(platform, plugin, editor, resolveTarget ?? ((t) => defaultResolveTarget(editor, t)));
}

export function runExtensionSetup(
  platform: Platform,
  plugins: PluginDefinition[],
  editor: EditorAPI,
  resolveTarget?: (t: DomTarget) => EventTarget
): void {
  const resolve = resolveTarget ?? ((t: DomTarget) => defaultResolveTarget(editor, t));
  for (const ext of plugins) {
    runSetup(platform, ext, editor, resolve);
  }
}

export function destroyPlatform(platform: Platform): void {
  for (const c of platform.cleanups.splice(0)) {
    c();
  }
}
