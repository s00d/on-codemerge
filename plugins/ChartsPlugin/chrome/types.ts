import type { EditorAPI, ToolbarConfig, ToolbarConfigItem, ToolbarMenuDef } from '@codemerge/sdk';
import type { ChartWorkspaceHandle } from '../surface/workspaceView';

export type ChartToolbarActionApi = {
  editor: EditorAPI;
  workspace: ChartWorkspaceHandle | null;
};

export type ChartToolbarMenu = ToolbarMenuDef;
export type ChartToolbarItem = ToolbarConfigItem<ChartToolbarActionApi>;
export type ChartToolbarOptions = ToolbarConfig<ChartToolbarActionApi>;
