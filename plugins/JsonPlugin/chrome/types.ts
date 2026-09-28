import type {
  EditorAPI,
  ToolbarConfig,
  ToolbarConfigItem,
  ToolbarMenuDef,
} from '@on-codemerge/sdk';
import type { JsonWorkspaceHandle } from '../surface/workspaceView';

/** API passed to custom toolbar `run` handlers. */
export type JsonToolbarActionApi = {
  editor: EditorAPI;
  workspace: JsonWorkspaceHandle | null;
};

export type JsonToolbarMenu = ToolbarMenuDef;
export type JsonToolbarItem = ToolbarConfigItem<JsonToolbarActionApi>;
export type JsonToolbarOptions = ToolbarConfig<JsonToolbarActionApi>;
