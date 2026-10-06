export { core } from './core';
export {
  definePlugin,
  isDeclarativeWidget,
  collectPublishNodes,
  type Plugin,
  type PluginDefinition,
  type Hotkey,
  type WidgetDefinition,
  type WidgetContext,
} from './plugin';
export type { EditorAPI, LocaleMessages, TranslateParams } from './types';
export type { ToolbarButton, ToolbarMenuDef, ToolbarAction, ToolbarText } from './ui/toolbar';
export type { ToolbarConfig, ToolbarConfigItem, PluginToolbarOpts } from './ui/toolbarConfig';
export { applyToolbarConfig, pluginToolbarPlacement } from './ui/toolbarConfig';
export { KERNEL_UNDO_REDO_HOTKEYS } from './ui/historyToolbar';
export type { PopupHandle, PopupOptions, PopupItem, PopupButton } from './ui/popup';
export { PopupService, PopupController } from './ui/popup';
export type { MenuItem, MenuPosition } from './ui/context-menu';
export type { NotifyOptions, ConfirmOptions } from './ui/notify';
export { ToolbarPanel } from './ui/toolbar';
export { ContextMenuService } from './ui/context-menu';
export { NotifyService } from './ui/notify';
export { placeRoot, placeSubmenu, applyPlaceRoot, applyPlaceSubmenu } from './ui/place';
export {
  STUDIO_POPUP_CLASS,
  studioPaneTabs,
  syncStudioPanel,
  type StudioPaneTab,
} from './ui/studioLayout';
export {
  DisposableScope,
  OwnedSlot,
  teardownOwnable,
  type Disposable,
  type DisposeFn,
  type Ownable,
} from '@codemerge/view';
export {
  createPluginContext,
  type PluginContext,
  type DomTarget,
  type CreatePluginContextOptions,
} from './context';
export {
  h,
  foreign,
  img,
  video,
  iframe,
  canvas,
  mount,
  renderDetached,
  viewToHtml,
  createPortal,
  downloadUrl,
  downloadBlob,
  pickFile,
  copyText,
  readClipboardText,
  replaceChildrenWithHtml,
  asAttr,
  parseJson,
  type ViewSpec,
  type ViewElementSpec,
  type ViewForeignSpec,
  type MountHandle,
  type PortalHandle,
} from '@codemerge/view';
export {
  getPortalRoot,
  setPortalRoot,
  clearPortalRoot,
  teleport,
  isTeleport,
  type PortalTo,
  type PortalTargetName,
  type PortalOptions,
  type ViewTeleportSpec,
} from '@codemerge/view';
export {
  attrString,
  withMarkTarget,
  setMarkAttrs,
  setBlockAttr,
  clearStyles,
  convertBlockType,
  replaceBlockType,
  insertAtomAfter,
  insertBlockNearSelection,
  resolveInsertSite,
  findAncestorPath,
  wrapInList,
} from './commands';
export { PUBLISHED_CONTENT_CLASS, editorChromeTv } from './ui/chrome';
export {
  JSON_ATTR_KEYS,
  attrToHtmlValue,
  readJsonAttr,
  writeJsonAttr,
  coerceHtmlJsonAttr,
} from './platform/attrJson';
export { pathFromEl, nodeAtPath, queryAtomHosts, removeAtomAt } from './platform/atomPath';
export { atomAlignStyle } from './platform/atomAlign';
export { mediaFloatAlign } from './platform/mediaFloatAlign';
export { Resizer, type ResizerAspect, type ResizerOptions } from './platform/Resizer';
export {
  computeResize,
  effectiveAspectLock,
  type ResizeHandle,
  type ComputeResizeInput,
  type ComputeResizeResult,
} from './platform/resizeMath';
export {
  clamp,
  hexToHsv,
  hsvToHex,
  hexToRgb,
  rgbToHex,
  hsvToRgb,
  rgbToHsv,
  cssColorToHex,
  hueStrip,
  neutrals,
  quickSwatches,
  type Hsv,
  type Rgb,
} from './platform/colorMath';
export {
  ColorWell,
  colorWellView,
  openColorWell,
  pickColor,
  colorSwatchButton,
  colorChip,
  type ColorWellOptions,
} from './platform/ColorWell';
export {
  sanitizeHTML,
  parseSafeHtml,
  parseSafeSvg,
  serializeFragment,
  replaceChildrenWithSafeHtml,
  mountTrustedSvg,
} from './platform/safeHtml';
export {
  definePublishRuntime,
  registerPublishRuntime,
  readOcmConfig,
  setOcmConfig,
  neededRuntimeIds,
  composePublishedDocument,
  publishedCssHref,
  publishedJsHref,
  PublishRuntimeRegistry,
  publishRuntimes,
  OCM_CONFIG_ATTR,
  OCM_RUNTIME_ATTR,
  PUBLISHED_CDN_BASE,
  type PublishRuntimeDefinition,
  type PublishRuntimeMount,
  type PublishNodeDefinition,
  type ComposePublishedDocumentOptions,
} from './publish';
export { createFrameScheduler, type FrameScheduler } from './platform/scheduleFrame';
export { bindWindowDrag, type WindowDragHandlers } from './platform/bindWindowDrag';
export { isEditingInside } from './platform/isEditingInside';
export { createEmbedSessionStore, type EmbedSessionStore } from './platform/embedSessions';
export {
  createEmbedWorkspaceHost,
  type EmbedWorkspaceController,
  type EmbedWorkspaceHostOptions,
} from './platform/createEmbedWorkspaceHost';
