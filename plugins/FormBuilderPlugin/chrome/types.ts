import type { EditorAPI, ToolbarConfig, ToolbarConfigItem, ToolbarMenuDef } from '@codemerge/sdk';
import type { FormWorkspaceHandle } from '../surface/workspaceView';

export type FormToolbarActionApi = {
  editor: EditorAPI;
  workspace: FormWorkspaceHandle | null;
};

export type FormToolbarMenu = ToolbarMenuDef;
export type FormToolbarItem = ToolbarConfigItem<FormToolbarActionApi>;
export type FormToolbarOptions = ToolbarConfig<FormToolbarActionApi>;
