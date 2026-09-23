import type { PluginDefinition } from '@on-codemerge/sdk';

import { AIAssistantPlugin } from './AIAssistantPlugin';
import { AlignmentPlugin } from './AlignmentPlugin';
import { AnchorLinkPlugin } from './AnchorLinkPlugin';
import { BlockPlugin } from './BlockPlugin';
import { BlockStylePlugin } from './BlockStylePlugin';
import { CalendarPlugin } from './CalendarPlugin';
import { ChartsPlugin } from './ChartsPlugin';
import { CodeBlockPlugin } from './CodeBlockPlugin';
import { CollaborationPlugin, createOpsCollabBinding } from './CollaborationPlugin';
import { ColorPlugin } from './ColorPlugin';
import { CommentsPlugin } from './CommentsPlugin';
import { ExportPlugin } from './ExportPlugin';
import { FileUploadPlugin } from './FileUploadPlugin';
import { FontPlugin } from './FontPlugin';
import { FooterPlugin } from './FooterPlugin';
import { FootnotesPlugin } from './FootnotesPlugin';
import { FormBuilderPlugin } from './FormBuilderPlugin';
import { HistoryPlugin } from './HistoryPlugin';
import { HTMLViewerPlugin } from './HTMLViewerPlugin';
import { ImagePlugin } from './ImagePlugin';
import { LanguagePlugin } from './LanguagePlugin';
import { LinkPlugin } from './LinkPlugin';
import { ListsPlugin } from './ListsPlugin';
import { MathPlugin } from './MathPlugin';
import { MentionsPlugin } from './MentionsPlugin';
import { PDFEmbedPlugin } from './PDFEmbedPlugin';
import { ResponsivePlugin } from './ResponsivePlugin';
import { ShortcutsPlugin } from './ShortcutsPlugin';
import { SpellCheckerPlugin } from './SpellCheckerPlugin';
import { TablePlugin } from './TablePlugin';
import { TemplatesPlugin } from './TemplatesPlugin';
import { TimerPlugin } from './TimerPlugin';
import { ToolbarDividerPlugin, ToolbarPlugin } from './ToolbarPlugin';
import { TrackChangesPlugin } from './TrackChangesPlugin';
import { TypographyPlugin } from './TypographyPlugin';
import { VideoPlugin } from './VideoPlugin';
import { YouTubeVideoPlugin } from './YouTubeVideoPlugin';

export {
  AIAssistantPlugin,
  AlignmentPlugin,
  AnchorLinkPlugin,
  BlockPlugin,
  BlockStylePlugin,
  CalendarPlugin,
  ChartsPlugin,
  CodeBlockPlugin,
  CollaborationPlugin,
  createOpsCollabBinding,
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
  ToolbarDividerPlugin,
  ToolbarPlugin,
  TrackChangesPlugin,
  TypographyPlugin,
  VideoPlugin,
  YouTubeVideoPlugin,
};

export type { SpellCheckerOptions, SpellDictionaryFiles } from './SpellCheckerPlugin';

/** Full default plugin set (toolbar panel is core-owned; plugins register buttons). */
export function createDefaultPlugins(): PluginDefinition[] {
  return [
    ToolbarPlugin(),
    HistoryPlugin(),
    TypographyPlugin(),
    ColorPlugin(),
    FontPlugin(),
    LinkPlugin(),
    AlignmentPlugin(),
    ListsPlugin(),
    BlockPlugin(),
    BlockStylePlugin(),
    TablePlugin(),
    ImagePlugin(),
    VideoPlugin(),
    YouTubeVideoPlugin(),
    FileUploadPlugin(),
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
  ];
}

/** Lean set for demos / apps that want essentials only. */
export function createCorePlugins(): PluginDefinition[] {
  return [
    ToolbarPlugin(),
    HistoryPlugin(),
    TypographyPlugin(),
    ColorPlugin(),
    FontPlugin(),
    LinkPlugin(),
    AlignmentPlugin(),
    ListsPlugin(),
    BlockPlugin(),
    TablePlugin(),
    ImagePlugin(),
    CodeBlockPlugin(),
    MathPlugin(),
    ExportPlugin(),
    ShortcutsPlugin(),
  ];
}
