import type { Command, MarkSpec, NodeSpec } from '@on-codemerge/kernel';
import type { EditorAPI } from './types';
import type { PluginContext } from './context';
import type { ViewSpec } from './ui/view';
import type { MenuItem } from './ui/context-menu';
import type { DisposableScope } from './disposable';
import type { PublishNodeDefinition } from './publish';

export interface Hotkey {
  icon?: string;
  keys: string;
  description?: string;
  command: string;
}

/** Context passed to declarative atom widgets. */
export interface WidgetContext {
  attrs: Record<string, unknown>;
  path: number[];
  updateAttrs: (partial: Record<string, unknown>) => void;
  openMenu: (items: MenuItem[], x: number, y: number) => void;
  /** Widget lifetime scope — use own/slot/on; disposed on unmount. */
  scope: DisposableScope;
  editor: EditorAPI;
}

/** Declarative widget: returns ViewSpec; core mounts it. */
export type WidgetDefinition = {
  render: (attrs: Record<string, unknown>, ctx: WidgetContext) => ViewSpec;
};

export interface PluginDefinition {
  name: string;
  version?: string;
  nodes?: NodeSpec[];
  marks?: MarkSpec[];
  commands?: Record<string, Command>;
  shortcuts?: { keys: string; command: string }[];
  hotkeys?: Hotkey[];
  widgets?: Record<string, WidgetDefinition>;
  dependsOn?: string[];
  /** Published HTML hydrate for atoms — return ViewSpec (`render`), not HTML strings. */
  publish?: PublishNodeDefinition | PublishNodeDefinition[];
  /** Setup with auto-dispose PluginContext. */
  setup?: (ctx: PluginContext) => void;
}

export function definePlugin(def: PluginDefinition): PluginDefinition {
  return def;
}

export type Plugin = PluginDefinition;

export function isDeclarativeWidget(
  w: WidgetDefinition
): w is { render: (attrs: Record<string, unknown>, ctx: WidgetContext) => ViewSpec } {
  return typeof w === 'object' && w !== null && typeof w.render === 'function';
}

/** Flatten plugin publish hooks into a node→def map. */
export function collectPublishNodes(
  plugins: readonly PluginDefinition[]
): Map<string, PublishNodeDefinition> {
  const map = new Map<string, PublishNodeDefinition>();
  for (const plugin of plugins) {
    if (!plugin.publish) {
      continue;
    }
    const list = Array.isArray(plugin.publish) ? plugin.publish : [plugin.publish];
    for (const def of list) {
      map.set(def.node, def);
    }
  }
  return map;
}
