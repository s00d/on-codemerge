import type { PluginDefinition, PluginToolbarOpts } from '@codemerge/sdk';

import { AIAssistantPlugin } from '@ocm/ai-assistant-plugin';
import { AlignmentPlugin } from '@ocm/alignment-plugin';
import { AnchorLinkPlugin } from '@ocm/anchor-link-plugin';
import { BlockPlugin } from '@ocm/block-plugin';
import { BlockStylePlugin } from '@ocm/block-style-plugin';
import { CalendarPlugin } from '@ocm/calendar-plugin';
import { ChartsPlugin } from '@ocm/charts-plugin';
import { ClearStylesPlugin } from '@ocm/clear-styles-plugin';
import { CodeBlockPlugin } from '@ocm/code-block-plugin';
import type { CodeBlockPluginOptions, CodeBlockPluginFeatures } from '@ocm/code-block-plugin';
import {
  CollaborationPlugin,
  createOpsCollabBinding,
  getCollaborationHandle,
} from '@ocm/collaboration-plugin';
import { ColorPlugin } from '@ocm/color-plugin';
import { CommentsPlugin } from '@ocm/comments-plugin';
import { ExportPlugin } from '@ocm/export-plugin';
import { FileUploadPlugin } from '@ocm/file-upload-plugin';
import type { UploadConfig } from '@ocm/file-upload-plugin/config/UploadConfig';
import { FontPlugin } from '@ocm/font-plugin';
import { FooterPlugin } from '@ocm/footer-plugin';
import { FootnotesPlugin } from '@ocm/footnotes-plugin';
import { FormBuilderPlugin } from '@ocm/form-builder-plugin';
import { HistoryPlugin } from '@ocm/history-plugin';
import { HTMLViewerPlugin } from '@ocm/html-viewer-plugin';
import { ImagePlugin } from '@ocm/image-plugin';
import type { ImagePluginOptions } from '@ocm/image-plugin';
import { JsonPlugin } from '@ocm/json-plugin';
import type { JsonPluginOptions, JsonPluginFeatures } from '@ocm/json-plugin';
import { MarkdownPlugin } from '@ocm/markdown-plugin';
import type { MarkdownPluginOptions, MarkdownPluginFeatures } from '@ocm/markdown-plugin';
import { LanguagePlugin } from '@ocm/language-plugin';
import { LinkPlugin } from '@ocm/link-plugin';
import { ListsPlugin } from '@ocm/lists-plugin';
import { MathPlugin } from '@ocm/math-plugin';
import { MentionsPlugin } from '@ocm/mentions-plugin';
import { PDFEmbedPlugin } from '@ocm/pdf-embed-plugin';
import { ResponsivePlugin } from '@ocm/responsive-plugin';
import { ShortcutsPlugin } from '@ocm/shortcuts-plugin';
import { SpellCheckerPlugin } from '@ocm/spell-checker-plugin';
import { TablePlugin } from '@ocm/table-plugin';
import type { TablePluginOptions, TablePluginFeatures } from '@ocm/table-plugin';
import { TemplatesPlugin } from '@ocm/templates-plugin';
import { TimerPlugin } from '@ocm/timer-plugin';
import { ToolbarPlugin } from '@ocm/toolbar-plugin';
import { TrackChangesPlugin } from '@ocm/track-changes-plugin';
import { TypographyPlugin } from '@ocm/typography-plugin';
import { VideoPlugin } from '@ocm/video-plugin';
import { YouTubeVideoPlugin } from '@ocm/youtube-video-plugin';

export {
  AIAssistantPlugin,
  AlignmentPlugin,
  AnchorLinkPlugin,
  BlockPlugin,
  BlockStylePlugin,
  CalendarPlugin,
  ChartsPlugin,
  ClearStylesPlugin,
  CodeBlockPlugin,
  CollaborationPlugin,
  createOpsCollabBinding,
  getCollaborationHandle,
  ColorPlugin,
  CommentsPlugin,
  ExportPlugin,
  FileUploadPlugin,
  FontPlugin,
  FooterPlugin,
  FootnotesPlugin,
  FormBuilderPlugin,
  HistoryPlugin,
  HTMLViewerPlugin,
  ImagePlugin,
  JsonPlugin,
  MarkdownPlugin,
  LanguagePlugin,
  LinkPlugin,
  ListsPlugin,
  MathPlugin,
  MentionsPlugin,
  PDFEmbedPlugin,
  ResponsivePlugin,
  ShortcutsPlugin,
  SpellCheckerPlugin,
  TablePlugin,
  TemplatesPlugin,
  TimerPlugin,
  ToolbarPlugin,
  TrackChangesPlugin,
  TypographyPlugin,
  VideoPlugin,
  YouTubeVideoPlugin,
};

export type { JsonPluginOptions, JsonPluginFeatures };
export type { MarkdownPluginOptions, MarkdownPluginFeatures };
export type { CodeBlockPluginOptions, CodeBlockPluginFeatures };
export type { TablePluginOptions, TablePluginFeatures };
export type { SpellCheckerOptions, SpellDictionaryFiles } from '@ocm/spell-checker-plugin';
export type { ImagePluginOptions } from '@ocm/image-plugin';
export type { UploadConfig } from '@ocm/file-upload-plugin/config/UploadConfig';

export type CreateDefaultPluginsOptions = {
  image?: ImagePluginOptions;
  fileUpload?: Partial<UploadConfig> & PluginToolbarOpts;
};

/** Full default plugin set (toolbar panel is core-owned; plugins register buttons). */
export function createDefaultPlugins(opts: CreateDefaultPluginsOptions = {}): PluginDefinition[] {
  return [
    ToolbarPlugin(),
    HistoryPlugin(),
    TypographyPlugin(),
    ColorPlugin(),
    FontPlugin(),
    LinkPlugin(),
    ClearStylesPlugin(),
    AlignmentPlugin(),
    ListsPlugin(),
    BlockPlugin(),
    BlockStylePlugin(),
    TablePlugin(),
    ImagePlugin(opts.image ?? {}),
    VideoPlugin(),
    YouTubeVideoPlugin(),
    FileUploadPlugin(opts.fileUpload ?? {}),
    PDFEmbedPlugin(),
    CodeBlockPlugin(),
    MathPlugin(),
    ChartsPlugin(),
    CalendarPlugin(),
    TimerPlugin(),
    FormBuilderPlugin(),
    CommentsPlugin(),
    MentionsPlugin(),
    FootnotesPlugin(),
    FooterPlugin(),
    // CollaborationPlugin is opt-in (requires token + ops server); not in defaults.
    ShortcutsPlugin(),
    ExportPlugin(),
    HTMLViewerPlugin(),
    TemplatesPlugin(),
    ResponsivePlugin(),
    LanguagePlugin(),
    AIAssistantPlugin(),
    TrackChangesPlugin(),
    AnchorLinkPlugin(),
    JsonPlugin({ surface: 'atom' }),
    MarkdownPlugin({ surface: 'atom' }),
  ];
}

/** Lean set for demos / apps that want essentials only. */
export function createCorePlugins(opts: CreateDefaultPluginsOptions = {}): PluginDefinition[] {
  return [
    ToolbarPlugin(),
    HistoryPlugin(),
    TypographyPlugin(),
    ColorPlugin(),
    FontPlugin(),
    LinkPlugin(),
    ClearStylesPlugin(),
    AlignmentPlugin(),
    ListsPlugin(),
    BlockPlugin(),
    TablePlugin(),
    ImagePlugin(opts.image ?? {}),
    CodeBlockPlugin(),
    MathPlugin(),
    ShortcutsPlugin(),
    ExportPlugin(),
  ];
}
