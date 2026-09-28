import { Editor as SharedEditor } from '@on-codemerge/editor';
import type { ProseIoOverrides, SharedEditorOptions } from '@on-codemerge/editor';
import type { DocNode, JSONDoc } from '@on-codemerge/kernel';
import type { EditorAPI, PluginDefinition } from '@on-codemerge/sdk';
import {
  collectPublishNodes,
  composePublishedDocument,
  neededRuntimeIds,
  publishedCssHref,
  publishedJsHref,
} from '@on-codemerge/sdk';
import type { Translations } from '@i18n-micro/runtime';
import { exportHTML, exportMarkdown, exportPublishedHTML, importHTML, importMarkdown } from '../io';
import { createCeView } from './createCeView';

/** Live AS-IS construct bag (shim). Shared package uses `SharedEditorOptions`. */
export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  /** See SharedEditorOptions.toolbar — `{ menus: [] }` for a flat bar (no Insert ▾). */
  toolbar?: SharedEditorOptions['toolbar'];
}

function pluginsFrom(editor: object): PluginDefinition[] {
  const fn: unknown = Reflect.get(editor, 'listPlugins');
  if (typeof fn !== 'function') {
    return [];
  }
  const result: unknown = Reflect.apply(fn, editor, []);
  if (!Array.isArray(result)) {
    return [];
  }
  return result.filter((p): p is PluginDefinition => {
    return typeof p === 'object' && p !== null && typeof Reflect.get(p, 'name') === 'string';
  });
}

function replaceDocumentOf(editor: EditorAPI, doc: DocNode | JSONDoc): void {
  const fn: unknown = Reflect.get(editor, 'replaceDocument');
  if (typeof fn !== 'function') {
    editor.setJSON(doc);
    return;
  }
  Reflect.apply(fn, editor, [doc]);
}

function createProseIo(): ProseIoOverrides {
  return {
    getHTML(this: EditorAPI) {
      return exportHTML(this.getState().doc);
    },
    setHTML(this: EditorAPI, html: string) {
      replaceDocumentOf(this, importHTML(html));
    },
    getMarkdown(this: EditorAPI) {
      return exportMarkdown(this.getState().doc);
    },
    setMarkdown(this: EditorAPI, md: string) {
      replaceDocumentOf(this, importMarkdown(md));
    },
    getPublishedHTML(this: EditorAPI) {
      return exportPublishedHTML(this.getState().doc, collectPublishNodes(pluginsFrom(this)));
    },
    getPublishedJS(this: EditorAPI) {
      const html = this.getPublishedHTML();
      return neededRuntimeIds(html).length > 0 ? publishedJsHref() : null;
    },
    getPublishedDocument(this: EditorAPI) {
      const bodyHtml = this.getPublishedHTML();
      return composePublishedDocument({
        bodyHtml,
        cssHref: publishedCssHref(),
        jsHref: neededRuntimeIds(bodyHtml).length > 0 ? publishedJsHref() : null,
      });
    },
  };
}

/**
 * WYSIWYG entry: `@on-codemerge/editor` + CE ViewPort + prose HTML/MD/publish IO.
 */
export class Editor extends SharedEditor {
  constructor(host: HTMLElement, options: EditorOptions = {}) {
    const shared: SharedEditorOptions = {
      ...options,
      createView: createCeView,
      io: createProseIo(),
    };
    super(host, shared);
  }
}
