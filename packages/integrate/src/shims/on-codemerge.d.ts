declare module 'on-codemerge' {
  export type PluginDefinition = { name: string; [key: string]: unknown };

  export interface CreatePackPluginsOptions {
    image?: Record<string, unknown>;
    fileUpload?: Record<string, unknown>;
  }

  export interface EditorOptions {
    plugins?: PluginDefinition[];
    chrome?: 'bar' | 'page';
    locale?: string;
    fallbackLocale?: string;
    colorScheme?: 'host' | 'system';
    toolbar?: { menus?: unknown[] };
    history?: { maxDepth?: number; mergeWindowMs?: number };
    messages?: Record<string, unknown>;
    doc?: unknown;
    /** Opt-in timing hooks (forwarded to shared Editor). */
    diagnostics?: {
      onMeasure?: (name: string, ms: number, ctx?: { source?: string }) => void;
    };
  }

  export class Editor {
    constructor(host: HTMLElement, options?: EditorOptions);
    getHTML(): string;
    setHTML(html: string): void;
    getMarkdown(): string;
    setMarkdown(md: string): void;
    on(
      event: 'docChanged' | 'selectionChanged' | 'transaction',
      cb: (...args: unknown[]) => void
    ): () => void;
    destroy(): void;
  }

  export function createCorePlugins(opts?: CreatePackPluginsOptions): PluginDefinition[];
  export function createDefaultPlugins(opts?: CreatePackPluginsOptions): PluginDefinition[];
}

declare module 'on-codemerge/index.css';
declare module 'on-codemerge/public.css';
