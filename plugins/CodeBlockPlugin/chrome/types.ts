import type { EditorAPI, ToolbarConfig, ToolbarConfigItem, ToolbarMenuDef } from '@codemerge/sdk';
import type { CodeWorkspaceHandle } from '../surface/workspaceView';

export type CodeToolbarActionApi = {
  editor: EditorAPI;
  workspace: CodeWorkspaceHandle | null;
};

export type CodeToolbarMenu = ToolbarMenuDef;
export type CodeToolbarItem = ToolbarConfigItem<CodeToolbarActionApi>;
export type CodeToolbarOptions = ToolbarConfig<CodeToolbarActionApi>;
