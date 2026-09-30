import type { EditorAPI, ToolbarConfig, ToolbarConfigItem, ToolbarMenuDef } from '@codemerge/sdk';
import type { MdWorkspaceHandle } from '../surface/workspaceView';

/** API passed to custom toolbar `run` handlers. */
export type MdToolbarActionApi = {
  editor: EditorAPI;
  workspace: MdWorkspaceHandle | null;
};

export type MdToolbarMenu = ToolbarMenuDef;
export type MdToolbarItem = ToolbarConfigItem<MdToolbarActionApi>;
export type MdToolbarOptions = ToolbarConfig<MdToolbarActionApi>;
