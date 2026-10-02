import type { EditorAPI, ToolbarConfig, ToolbarConfigItem, ToolbarMenuDef } from '@codemerge/sdk';
import type { CalendarWorkspaceHandle } from '../surface/workspaceView';

export type CalendarToolbarActionApi = {
  editor: EditorAPI;
  workspace: CalendarWorkspaceHandle | null;
};

export type CalendarToolbarMenu = ToolbarMenuDef;
export type CalendarToolbarItem = ToolbarConfigItem<CalendarToolbarActionApi>;
export type CalendarToolbarOptions = ToolbarConfig<CalendarToolbarActionApi>;
