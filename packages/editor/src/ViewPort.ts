import type { DocNode, EditorState, JSONDoc } from '@on-codemerge/kernel';
import type { EditorAPI, PluginDefinition, WidgetDefinition } from '@on-codemerge/sdk';

/** Live editor surface passed to `createView` (facade + view-factory hooks). */
export type ViewHost = EditorAPI & {
  getWidgets(): Map<string, WidgetDefinition>;
  asAlive(): EditorAPI | null;
  listPlugins(): readonly PluginDefinition[];
  /** Full-document replace; resets selection (unlike `setJSON`). */
  replaceDocument(doc: DocNode | JSONDoc): void;
};

/** App-supplied projection surface (CE, Tree+Raw, …). */
export type ViewPort = {
  update(state: EditorState): void;
  /** Selection-only projection; falls back to `update` when omitted. */
  updateSelection?(state: EditorState): void;
  destroy(): void;
  /** Target for PluginContext.onDom('content'). */
  contentTarget(): EventTarget;
  /** Optional DOM content root (page chrome / CE). */
  contentElement?(): HTMLElement | null;
};

export type CreateView = (editor: ViewHost) => ViewPort;
