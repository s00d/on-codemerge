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
export {
  highlightHtml,
  escapeHtml,
  tokensToHtml,
  lex,
  HIGHLIGHT_MAX_CHARS,
  HIGHLIGHT_MAX_STEPS,
  HIGHLIGHT_MAX_TOKENS,
  TOKEN_TYPE_ALLOWLIST,
  type HighlightToken,
  type TokenType,
  type UniversalRule,
  type UniversalRules,
} from './highlight';
export {
  mountSourceEditor,
  sourceContentHeight,
  sourceScrollPadBottom,
  sourceGutterWidthPx,
  type SourceEditorHandle,
  type SourceEditorOptions,
} from './sourceEditor';
