export { Editor, type SharedEditorOptions, type ProseIoOverrides } from './Editor';
export { defaultWysiwygToolbarMenus } from './toolbarMenus';
export type { ViewPort, CreateView, ViewHost } from './ViewPort';
export { createShellView } from './createShellView';
export {
  createPlatform,
  destroyPlatform,
  registerPlugin,
  runExtensionSetup,
  type Platform,
  type Extension,
  type EditorHost,
} from './platform/Extension';
