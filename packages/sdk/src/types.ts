import type {
  Command,
  DocNode,
  EditorState,
  JSONDoc,
  Mark,
  Schema,
  Selection,
  Transaction,
} from '@on-codemerge/kernel';
import type { ToolbarButton, ToolbarMenuDef } from './ui/toolbar';
import type { PopupService } from './ui/popup';
import type { ContextMenuService } from './ui/context-menu';
import type { NotifyOptions, NotifyService } from './ui/notify';
import type { PluginDefinition } from './plugin';

/** Nested locale message tree. */
export type LocaleMessages = Record<string, unknown>;

/** Interpolation params for `t()` — matches `@i18n-micro` Params. */
export type TranslateParams = Record<string, string | number | boolean>;

/** Full surface plugins use — owned by Editor / SDK. */
export interface EditorAPI {
  /**
   * @internal Prefer `ctx.onDom` in plugins — do not create/mutate DOM under host.
   */
  readonly host: HTMLElement;
  /**
   * `bar` — sticky toolbar + footer.
   * `page` — fullscreen content; toolbar shown in a popup on click.
   */
  readonly chrome: 'bar' | 'page';
  /** Sealed document schema (nodes + marks) from the platform. */
  readonly schema: Schema;
  command: (name: string) => boolean;
  run: (command: Command) => boolean;
  undo: () => boolean;
  redo: () => boolean;
  getJSON: () => JSONDoc;
  setJSON: (json: JSONDoc | DocNode) => void;
  getHTML: () => string;
  setHTML: (html: string) => void;
  /**
   * Hydrate fragment for published pages (plugin `publish.render`).
   * No `<script>` tags — pair with `getPublishedJS` / `getPublishedDocument`.
   */
  getPublishedHTML: () => string;
  /** CDN/`dist/public.js` href when the fragment needs runtimes; otherwise null. */
  getPublishedJS: () => string | null;
  /** Full standalone HTML document (css + optional public.js). */
  getPublishedDocument: () => string;
  /** Current editor state (doc + selection) for mark probes / commands. */
  getState: () => EditorState;
  /** Serialize document model to Markdown (CommonMark/GFM subset). */
  getMarkdown: () => string;
  /** Replace document from Markdown (parses into JSON DocNode tree). */
  setMarkdown: (md: string) => void;
  dispatch: (tr: Transaction) => void;
  setSelection: (selection: Selection) => void;
  getSelection: () => Selection;
  /** Marks applied to the next typed characters (track-changes, pending format). */
  getStoredMarks: () => Mark[];
  setStoredMarks: (marks: Mark[]) => void;
  /** Soft-delete mark for backspace (track-changes deletion); null = hard delete. */
  getSoftDeleteMark: () => Mark | null;
  setSoftDeleteMark: (mark: Mark | null) => void;
  on: (event: 'docChanged' | 'selectionChanged', cb: (state: EditorState) => void) => () => void;
  t: (key: string, params?: TranslateParams) => string;
  tc: (key: string, count: number) => string;
  getLocale: () => string;
  /** Always async — loads locale JSON on demand when needed. */
  setLocale: (locale: string) => Promise<void>;
  /** Inject/merge messages for a locale (e.g. app-provided pack). */
  registerLocale: (locale: string, dict: LocaleMessages) => void;
  /** Optional custom loader; built-in locales resolve via `src/i18n/locales`. */
  registerLocaleLoader: (locale: string, loader: () => Promise<LocaleMessages>) => void;
  onLocaleChange: (cb: () => void) => () => void;
  /** Shipped locale codes (`en` + lazy files under `src/i18n/locales`). */
  listLocales: () => string[];
  toolbar: {
    add: (btn: ToolbarButton) => () => void;
    defineMenu: (def: ToolbarMenuDef) => () => void;
    remove: (id: string) => void;
    refresh: () => void;
  };
  ui: {
    popup: PopupService;
    menu: ContextMenuService;
    contextMenu: ContextMenuService;
    notify: NotifyService;
  };
  use: (plugin: PluginDefinition) => void;
  notify: (options: NotifyOptions | string) => void;
  /** Registered plugin hotkeys for help UI (Shortcuts menu). */
  listShortcuts: () => { keys: string; description: string; category: string }[];
}
