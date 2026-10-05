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
} from '@ocm/plugins';

export type { SpellCheckerOptions, SpellDictionaryFiles } from '@ocm/plugins';
export type { JsonPluginOptions, JsonPluginFeatures } from '@ocm/plugins';
export type { MarkdownPluginOptions, MarkdownPluginFeatures } from '@ocm/plugins';
export type { CodeBlockPluginOptions, CodeBlockPluginFeatures } from '@ocm/plugins';
export type { TablePluginOptions, TablePluginFeatures } from '@ocm/plugins';
