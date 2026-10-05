import type { EditorAPI, ToolbarConfig, ToolbarConfigItem, ToolbarMenuDef } from '@codemerge/sdk';
import type { TableWorkspaceHandle } from '../surface/workspaceView';

export type TableToolbarActionApi = {
  editor: EditorAPI;
  workspace: TableWorkspaceHandle | null;
};

export type TableToolbarMenu = ToolbarMenuDef;
export type TableToolbarItem = ToolbarConfigItem<TableToolbarActionApi>;
export type TableToolbarOptions = ToolbarConfig<TableToolbarActionApi>;
