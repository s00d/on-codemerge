/**
 * Opt-in fat surface: `import { TablePlugin } from 'on-codemerge/plugins'`.
 * Prefer `createDefaultPlugins` / `createCorePlugins` from `on-codemerge` when possible.
 */
export {
  createDefaultPlugins,
  createCorePlugins,
  ToolbarPlugin,
  HistoryPlugin,
  TypographyPlugin,
  ColorPlugin,
  FontPlugin,
  LinkPlugin,
  ClearStylesPlugin,
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
  JsonPlugin,
  MarkdownPlugin,
} from '../../../plugins';

export type { SpellCheckerOptions, SpellDictionaryFiles } from '../../../plugins';
export type { JsonPluginOptions, JsonPluginFeatures } from '../../../plugins';
export type { MarkdownPluginOptions, MarkdownPluginFeatures } from '../../../plugins';
export type { CodeBlockPluginOptions, CodeBlockPluginFeatures } from '../../../plugins';
