export { Editor, type EditorOptions } from './editor/Editor';
export { ParseError } from '@codemerge/kernel';
export {
  CodeBlockPlugin,
  createDefaultPlugins,
  defaultCodeToolbar,
  emptyEditorDoc,
  isCodeEditorDoc,
  parseText,
  serializeText,
  serializeDoc,
  textFromDoc,
  languageFromDoc,
  MAX_CODE_BYTES,
  type CodeBlockPluginOptions,
  type CodeBlockPluginFeatures,
  type CodeToolbarOptions,
  type CodeToolbarItem,
  type CodeToolbarMenu,
  type CodeToolbarActionApi,
  type CodeBlockAttrs,
  type CodeSourceAttrs,
  type ParseTextResult,
} from '@ocm/code-block-plugin';
