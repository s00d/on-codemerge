export { Editor, type EditorOptions } from './editor/Editor';
export { ParseError } from '@codemerge/kernel';
export {
  JsonPlugin,
  createDefaultPlugins,
  defaultJsonToolbar,
  valueToDoc,
  docToValue,
  toEditorDoc,
  emptyEditorDoc,
  isJsonEditorDoc,
  indentFromDoc,
  parseText,
  serializeText,
  serializeDoc,
  type JsonPluginOptions,
  type JsonPluginFeatures,
  type JsonToolbarOptions,
  type JsonToolbarItem,
  type JsonToolbarMenu,
  type JsonToolbarActionApi,
} from '@ocm/json-plugin';
