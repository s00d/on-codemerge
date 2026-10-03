export { Editor, type EditorOptions } from './editor/Editor';
export {
  core,
  definePlugin,
  ToolbarPanel,
  PopupService,
  ContextMenuService,
  NotifyService,
  insertAtomAfter,
  setMarkAttrs,
  setBlockAttr,
  replaceBlockType,
  wrapInList,
  withMarkTarget,
  type Plugin,
  type PluginDefinition,
  type EditorAPI,
  type ToolbarButton,
  type ToolbarMenuDef,
  type PopupOptions,
  type MenuItem,
} from '@codemerge/sdk';

/** Lean / full plugin packs — individual plugins via `on-codemerge/plugins/<name>`. */
export { createDefaultPlugins, createCorePlugins } from '../../../plugins';

export type { SpellCheckerOptions, SpellDictionaryFiles } from '../../../plugins';
export type { JsonPluginOptions, JsonPluginFeatures } from '../../../plugins';
export type { MarkdownPluginOptions, MarkdownPluginFeatures } from '../../../plugins';
export type { CodeBlockPluginOptions, CodeBlockPluginFeatures } from '../../../plugins';

export {
  createDoc,
  createText,
  createParagraph,
  createState,
  insertText,
  deleteBackward,
  splitBlock,
  toggleMark,
  docToJSON,
  docFromJSON,
  createHistory,
  type DocNode,
  type JSONDoc,
  type EditorState,
  type Command,
} from '@codemerge/kernel';

export { exportHTML, importHTML, exportMarkdown, importMarkdown } from './io';
export { docToMarkdown, markdownToDoc } from './io/markdown';
export { sanitizeHTML } from './io/sanitize';
export { serializeJSON, parseJSON } from './io/json';
