import type { PluginContext } from '../context';
import type { EditorAPI } from '../types';
import type { ToolbarButton, ToolbarMenuDef } from './toolbar';

/** Declarative toolbar pack — menus use ToolbarMenuDef; items are ToolbarButton + optional `run`. */
export type ToolbarConfigItem<TApi = EditorAPI> = Omit<ToolbarButton, 'onClick'> & {
  onClick?: () => void;
  /** Deferred click; preferred over inventing parallel chrome types. */
  run?: (api: TApi) => void;
};

export type ToolbarConfig<TApi = EditorAPI> = {
  menus?: ToolbarMenuDef[];
  items?: ToolbarConfigItem<TApi>[];
};

/**
 * Optional toolbar placement for plugin factories.
 * - `menu` omitted → plugin default submenu
 * - `menu: null` → always a top-level bar button
 * - `menu: 'insert'` → that submenu (if host registered it)
 */
export type PluginToolbarOpts = {
  menu?: string | null;
  group?: string;
  order?: number;
};

/** Merge plugin factory opts onto hard-coded defaults for `ctx.toolbar.add`. */
export function pluginToolbarPlacement(
  defaults: { menu?: string; group?: string; order?: number },
  opts?: PluginToolbarOpts
): Pick<ToolbarButton, 'menu' | 'group' | 'order'> {
  const menu =
    opts !== undefined && Object.hasOwn(opts, 'menu') ? (opts.menu ?? undefined) : defaults.menu;
  const group = opts?.group ?? defaults.group;
  const order = opts?.order ?? defaults.order;
  return {
    ...(menu ? { menu } : {}),
    ...(group !== undefined ? { group } : {}),
    ...(order !== undefined ? { order } : {}),
  };
}

/**
 * Register menus/items via existing `ctx.toolbar`.
 * `resolveApi` is what item `run` receives (usually `() => ctx.editor`).
 */
export function applyToolbarConfig<TApi = EditorAPI>(
  ctx: PluginContext,
  config: ToolbarConfig<TApi>,
  resolveApi: () => TApi
): void {
  for (const menu of config.menus ?? []) {
    ctx.toolbar.defineMenu(menu);
  }
  for (const item of config.items ?? []) {
    ctx.toolbar.add(materializeItem(item, resolveApi));
  }
}

function materializeItem<TApi>(
  item: ToolbarConfigItem<TApi>,
  resolveApi: () => TApi
): ToolbarButton {
  const { run, onClick, command, ...rest } = item;
  if (onClick) {
    return { ...rest, command, onClick };
  }
  if (typeof run === 'function') {
    return {
      ...rest,
      onClick: () => {
        run(resolveApi());
      },
    };
  }
  return { ...rest, command };
}
