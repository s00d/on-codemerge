import { createCorePlugins, createDefaultPlugins, Editor } from 'on-codemerge';

/** Value formats supported by EditorHost. */
export type DocFormat = 'html' | 'markdown' | 'text';
export type ChromeMode = 'bar' | 'page';
export type ColorScheme = 'host' | 'system';
export type HostPlugins = Array<{ name: string; [key: string]: unknown }>;
export type HostPack = 'core' | 'default' | 'none';

export interface HostUploadEndpoints {
  upload?: string;
  download?: string;
  list?: string;
  delete?: string;
}

export interface HostUploadConfig {
  endpoints?: HostUploadEndpoints;
  headers?: Record<string, string> | (() => Record<string, string>);
  maxFileSize?: number;
  allowedTypes?: string[];
  /** Default true in packs. Set `false` when `endpoints.upload` is real. */
  useEmulation?: boolean;
}

export interface HostToolbarOptions {
  menus?: Array<{
    id: string;
    label?: string;
    icon?: string;
    group?: string;
    order?: number;
  }>;
}

export interface HostOptions {
  value?: string;
  format?: DocFormat;
  chrome?: ChromeMode;
  locale?: string;
  fallbackLocale?: string;
  colorScheme?: ColorScheme;
  toolbar?: HostToolbarOptions;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  messages?: Record<string, unknown>;
  diagnostics?: {
    onMeasure?: (name: string, ms: number, ctx?: { source?: string }) => void;
  };
  plugins?: HostPlugins;
  pack?: HostPack;
  image?: HostUploadConfig;
  fileUpload?: HostUploadConfig;
  pluginsAppend?: HostPlugins;
  onChange?: (value: string, format: DocFormat) => void;
  onReady?: (host: EditorHostHandle) => void;
}

export interface EditorHostHandle {
  readonly element: HTMLElement;
  readonly format: DocFormat;
  getValue(): string;
  setValue(value: string): void;
  getEditor(): unknown;
  destroy(): void;
}

export type CreateEditorHost = (el: HTMLElement, options?: HostOptions) => EditorHostHandle;

function resolveUpload(cfg?: HostUploadConfig): Record<string, unknown> | undefined {
  if (!cfg) {
    return undefined;
  }
  const headers = typeof cfg.headers === 'function' ? cfg.headers() : cfg.headers;
  const useEmulation =
    cfg.useEmulation ?? (cfg.endpoints?.upload !== undefined ? false : undefined);
  return {
    endpoints: cfg.endpoints,
    headers,
    maxFileSize: cfg.maxFileSize,
    allowedTypes: cfg.allowedTypes,
    useEmulation,
  };
}

/** Build plugin list: explicit `plugins`, else `pack` + upload, then `pluginsAppend`. */
export function createHostPlugins(options: HostOptions = {}): HostPlugins {
  const append = options.pluginsAppend ?? [];
  if (options.plugins) {
    return [...options.plugins, ...append];
  }
  const pack = options.pack ?? 'core';
  if (pack === 'none') {
    return [...append];
  }
  const packOpts = {
    image: resolveUpload(options.image),
    fileUpload: resolveUpload(options.fileUpload),
  };
  const base =
    pack === 'default'
      ? createDefaultPlugins(packOpts)
      : createCorePlugins({ image: packOpts.image });
  return [...base, ...append];
}

function readValue(editor: Editor, format: DocFormat): string {
  return format === 'html' ? editor.getHTML() : editor.getMarkdown();
}

function writeValue(editor: Editor, format: DocFormat, value: string): void {
  if (format === 'html') {
    editor.setHTML(value);
    return;
  }
  editor.setMarkdown(value);
}

/** Single lifecycle for every integrate adapter: mount → sync → destroy. */
export function createEditorHost(el: HTMLElement, options: HostOptions = {}): EditorHostHandle {
  const format: DocFormat = options.format ?? 'html';
  const editor = new Editor(el, {
    plugins: createHostPlugins(options),
    chrome: options.chrome ?? 'bar',
    locale: options.locale,
    fallbackLocale: options.fallbackLocale,
    colorScheme: options.colorScheme,
    toolbar: options.toolbar,
    history: options.history,
    messages: options.messages,
    diagnostics: options.diagnostics,
  });

  let applying = false;
  let destroyed = false;

  if (options.value !== undefined) {
    applying = true;
    try {
      writeValue(editor, format, options.value);
    } finally {
      applying = false;
    }
  }

  const off = editor.on('docChanged', () => {
    if (destroyed || applying) {
      return;
    }
    options.onChange?.(readValue(editor, format), format);
  });

  const handle: EditorHostHandle = {
    element: el,
    format,
    getValue: () => readValue(editor, format),
    setValue(value: string) {
      if (destroyed || readValue(editor, format) === value) {
        return;
      }
      applying = true;
      try {
        writeValue(editor, format, value);
      } finally {
        applying = false;
      }
    },
    getEditor: () => editor,
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      off();
      editor.destroy();
    },
  };

  options.onReady?.(handle);
  return handle;
}

/** Framework-agnostic mount (Angular / Preact / Solid / Qwik / Backbone / …). */
export function mountCodeMergeEditor(el: HTMLElement, options: HostOptions = {}): EditorHostHandle {
  return createEditorHost(el, options);
}
