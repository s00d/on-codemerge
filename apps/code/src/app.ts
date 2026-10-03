import '@ocm/wysiwyg/tailwind.css';
import '@codemerge/sdk/ui/sdk.scss';

export { Editor, type EditorOptions } from './editor/Editor';
export { ParseError } from '@ocm/wysiwyg/utils/parseSoT';
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
} from '../../../plugins/CodeBlockPlugin';
