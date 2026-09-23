import './tailwind.css';
import './index.scss';
import './public.css';
import '@on-codemerge/sdk/ui/sdk.scss';

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
} from '@on-codemerge/sdk';

export {
  createDefaultPlugins,
  createCorePlugins,
  ToolbarPlugin,
  ToolbarDividerPlugin,
  HistoryPlugin,
  TypographyPlugin,
  ColorPlugin,
  FontPlugin,
  LinkPlugin,
  AlignmentPlugin,
  ListsPlugin,
  BlockPlugin,
  BlockStylePlugin,
  TablePlugin,
  ImagePlugin,
  VideoPlugin,
  YouTubeVideoPlugin,
  FileUploadPlugin,
  PDFEmbedPlugin,
  CodeBlockPlugin,
  MathPlugin,
  ChartsPlugin,
  CalendarPlugin,
  TimerPlugin,
  FormBuilderPlugin,
  CommentsPlugin,
  MentionsPlugin,
  FootnotesPlugin,
  FooterPlugin,
  CollaborationPlugin,
  createOpsCollabBinding,
  ShortcutsPlugin,
  ExportPlugin,
  HTMLViewerPlugin,
  TemplatesPlugin,
  ResponsivePlugin,
  LanguagePlugin,
  SpellCheckerPlugin,
  AIAssistantPlugin,
  TrackChangesPlugin,
  AnchorLinkPlugin,
} from './plugins';

export type { SpellCheckerOptions, SpellDictionaryFiles } from './plugins';

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
} from '@on-codemerge/kernel';

export { exportHTML, importHTML, exportMarkdown, importMarkdown } from './io';
export { docToMarkdown, markdownToDoc } from './io/markdown';
export { sanitizeHTML } from './io/sanitize';
export { serializeJSON, parseJSON } from './io/json';
