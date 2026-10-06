import {
  createState,
  applyTransaction,
  createHistory,
  runCommand,
  deleteBackward,
  splitBlock,
  toggleMark,
  docToJSON,
  docFromJSON,
  createDoc,
  clampSelection,
} from '@codemerge/kernel';
import type {
  DocNode,
  JSONDoc,
  Selection,
  EditorState,
  Transaction,
  HistoryController,
  Command,
  Mark,
} from '@codemerge/kernel';
import {
  createPlatform,
  destroyPlatform,
  registerPlugin,
  runExtensionSetup,
} from './platform/Extension';
import type { Platform } from './platform/Extension';
import {
  ContextMenuService,
  NotifyService,
  PopupService,
  ToolbarPanel,
  clearPortalRoot,
} from '@codemerge/sdk';
import type {
  DomTarget,
  EditorAPI,
  LocaleMessages,
  NotifyOptions,
  PluginDefinition,
  ToolbarMenuDef,
  WidgetDefinition,
} from '@codemerge/sdk';
import { editorChromeTv } from '@codemerge/sdk/ui/chrome';
import { createI18n } from '@i18n-micro/runtime';
import type { I18n, Params, Translations } from '@i18n-micro/runtime';
import en from './i18n/locales/en.json';
import { listLocales, loadLocale } from './i18n/loadLocale';
import { PageChrome } from './PageChrome';
import { redoIcon, undoIcon } from './historyIcons';
import { defaultWysiwygToolbarMenus } from './toolbarMenus';
import type { CreateView, ViewPort } from './ViewPort';

export type ProseIoOverrides = Partial<
  Pick<
    EditorAPI,
    | 'getHTML'
    | 'setHTML'
    | 'getMarkdown'
    | 'setMarkdown'
    | 'getPublishedHTML'
    | 'getPublishedJS'
    | 'getPublishedDocument'
  >
>;

/** TARGET construct bag for `@codemerge/editor` — `createView` required. */
export interface SharedEditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  /**
   * Declares overflow menus (id / label / icon / group / order).
   * Omit → Insert / Review / Tools. `{ menus: [] }` → flat bar (plugin `menu:` ignored).
   */
  toolbar?: {
    menus?: ToolbarMenuDef[];
  };
  createView: CreateView;
  io?: ProseIoOverrides;
  /**
   * Opt-in timing hooks (Performance panel / custom sink).
   * When set, `dispatch` reports `view.update` / `toolbar.refresh` durations.
   */
  diagnostics?: {
    onMeasure?: (name: string, ms: number, ctx?: { source?: string }) => void;
  };
}

export type TransactionSource = 'local' | 'remote';

export type TransactionEvent = {
  tr: Transaction;
  source: TransactionSource;
  state: EditorState;
};

type Listener = (state: EditorState) => void;
type TransactionListener = (event: TransactionEvent) => void;

export class Editor implements EditorAPI {
  readonly host: HTMLElement;
  readonly chrome: 'bar' | 'page';
  private state: EditorState;
  private readonly view: ViewPort;
  private readonly history: HistoryController;
  private readonly ioOverrides: ProseIoOverrides;
  private readonly platform: Platform;
  private readonly plugins: PluginDefinition[];
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly transactionListeners = new Set<TransactionListener>();
  private destroyed = false;
  private readonly i18n: I18n;
  private readonly loadedLocales = new Set<string>();
  private readonly localeChangeListeners = new Set<() => void>();
  private readonly localeOverlays = new Set<(locale: string) => Promise<void>>();
  private localeReady: Promise<void> = Promise.resolve();
  private readonly toolbarPanel: ToolbarPanel;
  private readonly diagnostics: SharedEditorOptions['diagnostics'];
  private pageChrome: PageChrome | null = null;
  /** Marks applied to the next typed characters (e.g. track-changes insertion). */
  private storedMarks: Mark[] = [];
  /** When set, backspace soft-deletes via this mark instead of removing text. */
  private softDeleteMark: Mark | null = null;
  private readonly colorScheme: 'host' | 'system';
  private colorSchemeMql: MediaQueryList | null = null;
  private colorSchemeOnChange: ((e: MediaQueryListEvent) => void) | null = null;
  /** Roots where we added `dark` under `system` — only those we clear on destroy. */
  private readonly ownedDarkRoots = new WeakSet<Element>();
  /** Host chrome tokens applied in `applyHostChrome` — removed symmetrically on destroy. */
  private readonly hostChromeClasses: string[] = [];
  /** Menu ids registered via toolbar config or `defineMenu` (missing → bar). */
  private readonly toolbarMenuIds = new Set<string>();
  readonly ui: {
    popup: PopupService;
    menu: ContextMenuService;
    contextMenu: ContextMenuService;
    notify: NotifyService;
  };
  readonly toolbar: {
    add: EditorAPI['toolbar']['add'];
    defineMenu: EditorAPI['toolbar']['defineMenu'];
    remove: EditorAPI['toolbar']['remove'];
    refresh: EditorAPI['toolbar']['refresh'];
  };

  constructor(host: HTMLElement, options: SharedEditorOptions) {
    this.host = host;
    this.chrome = options.chrome ?? 'bar';
    this.applyHostChrome();
    this.colorScheme = options.colorScheme ?? 'host';
    this.plugins = options.plugins ?? [];
    this.ioOverrides = options.io ?? {};
    this.diagnostics = options.diagnostics;
    this.platform = createPlatform(this.plugins);
    this.i18n = createI18n({
      locale: 'en',
      fallbackLocale: options.fallbackLocale ?? 'en',
      missingWarn: false,
      messages: {
        en,
        ...options.messages,
      },
    });
    this.loadedLocales.add('en');
    if (options.messages) {
      for (const code of Object.keys(options.messages)) {
        this.loadedLocales.add(code);
      }
    }
    const initialLocale = options.locale && options.locale !== '' ? options.locale : 'en';

    const rawDoc = options.doc;
    let doc;
    if (rawDoc === undefined) {
      doc = createDoc();
    } else if (
      typeof rawDoc === 'object' &&
      rawDoc !== null &&
      'version' in rawDoc &&
      'doc' in rawDoc
    ) {
      doc = docFromJSON(rawDoc);
    } else {
      doc = rawDoc;
    }
    this.state = createState(doc);
    this.history = createHistory({ ...options.history, schema: this.platform.schema });

    this.toolbarPanel = new ToolbarPanel(host, (name) => {
      if (name === 'undo') {
        this.undo();
      } else if (name === 'redo') {
        this.redo();
      } else {
        this.command(name);
      }
    });
    this.toolbar = {
      add: (btn) => {
        if (btn.menu && !this.toolbarMenuIds.has(btn.menu)) {
          const { menu, ...rest } = btn;
          return this.toolbarPanel.add({
            ...rest,
            group: rest.group ?? menu,
          });
        }
        return this.toolbarPanel.add(btn);
      },
      defineMenu: (def) => {
        this.toolbarMenuIds.add(def.id);
        return this.toolbarPanel.defineMenu(def);
      },
      refresh: () => {
        this.toolbarPanel.refresh();
      },
      remove: (id) => {
        this.toolbarMenuIds.delete(id);
        this.toolbarPanel.remove(id);
      },
    };
    this.registerToolbarMenus(options.toolbar);
    this.seedHistoryToolbar();

    const contextMenu = new ContextMenuService(host);
    const popup = new PopupService(host);
    this.ui = {
      contextMenu,
      menu: contextMenu,
      notify: new NotifyService(host, popup),
      popup,
    };

    if (!this.platform.commands.has('deleteBackward')) {
      this.platform.commands.set('deleteBackward', deleteBackward);
    }
    if (!this.platform.commands.has('splitBlock')) {
      this.platform.commands.set('splitBlock', splitBlock);
    }
    if (!this.platform.commands.has('toggleBold')) {
      this.platform.commands.set('toggleBold', toggleMark('bold'));
    }
    if (!this.platform.commands.has('toggleItalic')) {
      this.platform.commands.set('toggleItalic', toggleMark('italic'));
    }

    this.bindShortcuts();
    // Bootstrap TARGET: platform sealed → createView(editor) → setup(ctx) → setLocale
    // Plugins merge en overlays in setup before the initial non-en locale loads.
    this.view = options.createView(this);
    runExtensionSetup(this.platform, this.plugins, this, (t) => this.resolveDomTarget(t));
    if (initialLocale !== 'en') {
      this.localeReady = this.setLocale(initialLocale);
    }
    this.setupColorScheme();
    if (this.chrome === 'page') {
      const contentEl = this.view.contentElement?.() ?? null;
      if (contentEl) {
        this.pageChrome = new PageChrome(contentEl, this.toolbarPanel);
        this.pageChrome.start();
      }
    }
  }

  private projectSelection(state: EditorState): void {
    if (this.view.updateSelection) {
      this.view.updateSelection(state);
    } else {
      this.view.update(state);
    }
  }

  private colorSchemeRoots(): HTMLElement[] {
    const roots: HTMLElement[] = [document.documentElement];
    const iframe = this.host.querySelector('iframe');
    const iframeHtml = iframe?.contentDocument?.documentElement;
    if (iframeHtml) {
      roots.push(iframeHtml);
    }
    return roots;
  }

  private applySystemColorScheme(isDark: boolean): void {
    for (const root of this.colorSchemeRoots()) {
      if (isDark) {
        if (!root.classList.contains('dark')) {
          root.classList.add('dark');
          this.ownedDarkRoots.add(root);
        }
      } else if (this.ownedDarkRoots.has(root)) {
        root.classList.remove('dark');
        this.ownedDarkRoots.delete(root);
      }
    }
  }

  private setupColorScheme(): void {
    if (this.colorScheme !== 'system' || typeof matchMedia !== 'function') {
      return;
    }
    this.colorSchemeMql = matchMedia('(prefers-color-scheme: dark)');
    this.applySystemColorScheme(this.colorSchemeMql.matches);
    this.colorSchemeOnChange = (e) => {
      this.applySystemColorScheme(e.matches);
    };
    this.colorSchemeMql.addEventListener('change', this.colorSchemeOnChange);
  }

  private teardownColorScheme(): void {
    if (this.colorSchemeMql && this.colorSchemeOnChange) {
      this.colorSchemeMql.removeEventListener('change', this.colorSchemeOnChange);
    }
    this.colorSchemeMql = null;
    this.colorSchemeOnChange = null;
    if (this.colorScheme === 'system') {
      for (const root of this.colorSchemeRoots()) {
        if (this.ownedDarkRoots.has(root)) {
          root.classList.remove('dark');
          this.ownedDarkRoots.delete(root);
        }
      }
    }
  }

  private bindShortcuts(): void {
    this.host.addEventListener('keydown', this.onHostKeydown);
  }

  private readonly onHostKeydown = (e: KeyboardEvent): void => {
    if (e.defaultPrevented) {
      return;
    }
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) {
      return;
    }
    const key = e.key.toLowerCase(),
      parts = ['Mod'];
    if (e.altKey) {
      parts.push('Alt');
    }
    if (e.shiftKey) {
      parts.push('Shift');
    }
    parts.push(key.length === 1 ? key : e.key);
    const combo = parts.join('-'),
      hit = this.platform.shortcuts.find((s) => s.keys.toLowerCase() === combo.toLowerCase());
    if (!hit) {
      return;
    }
    const target = e.target;
    const inSource = target instanceof Element && target.closest('.ocm-source-editor') !== null;
    if (inSource && (hit.command === 'undo' || hit.command === 'redo')) {
      return;
    }
    if (hit.command === 'undo') {
      if (this.undo()) {
        e.preventDefault();
      }
      return;
    }
    if (hit.command === 'redo') {
      if (this.redo()) {
        e.preventDefault();
      }
      return;
    }
    e.preventDefault();
    this.command(hit.command);
  };

  private resolveDomTarget(target: DomTarget): EventTarget {
    if (target === 'content') {
      return this.view.contentTarget();
    }
    return this.host;
  }

  /** ViewPort content root for plugins (shell / CE). */
  contentElement(): HTMLElement | null {
    const el = this.view.contentElement?.() ?? null;
    if (el instanceof HTMLElement) {
      return el;
    }
    const target = this.view.contentTarget();
    return target instanceof HTMLElement ? target : null;
  }

  use(plugin: PluginDefinition): void {
    registerPlugin(this.platform, plugin, this, (t) => this.resolveDomTarget(t));
    this.plugins.push(plugin);
  }

  t(key: string, params?: Params): string {
    return this.i18n.ts(key, params);
  }

  tc(key: string, count: number): string {
    return this.i18n.tc(key, count);
  }

  getLocale(): string {
    return this.i18n.getLocale();
  }

  listLocales(): string[] {
    return listLocales();
  }

  /**
   * Switch UI locale. Always async — same call for `en`, `ru`, or any shipped/lazy code.
   * Built-in packs live in package `i18n/locales/*.json` and load on demand.
   */
  async setLocale(locale: string): Promise<void> {
    if (!this.loadedLocales.has(locale)) {
      const dict = await loadLocale(locale);
      if (dict !== null) {
        this.i18n.addTranslations(locale, dict, true);
        this.loadedLocales.add(locale);
      }
    }
    this.i18n.locale = locale;
    await Promise.all([...this.localeOverlays].map((load) => load(locale)));
    this.toolbarPanel.refresh();
    for (const cb of this.localeChangeListeners) {
      cb();
    }
  }

  /** Resolves when the constructor `locale` option (if non-en) has finished loading. */
  whenLocaleReady(): Promise<void> {
    return this.localeReady;
  }

  /**
   * Merge messages for a locale without marking it base-loaded.
   * Plugins use this for overlay packs; `setLocale` still loads the editor core JSON.
   */
  registerLocale(locale: string, dict: LocaleMessages): void {
    this.i18n.addTranslations(locale, dict, true);
  }

  /**
   * Plugin locale packs — awaited inside `setLocale` after the core JSON loads.
   * Immediately runs once for the current locale.
   */
  registerLocaleOverlay(load: (locale: string) => Promise<void>): () => void {
    this.localeOverlays.add(load);
    void load(this.getLocale());
    return () => {
      this.localeOverlays.delete(load);
    };
  }

  onLocaleChange(cb: () => void): () => void {
    this.localeChangeListeners.add(cb);
    return () => {
      this.localeChangeListeners.delete(cb);
    };
  }

  /**
   * Register overflow menus from construct options.
   * Omit `toolbar` → Insert / Review / Tools. `{ menus: [] }` → none (flat bar).
   */
  private registerToolbarMenus(toolbar?: SharedEditorOptions['toolbar']): void {
    const menus =
      toolbar === undefined
        ? defaultWysiwygToolbarMenus((key) => this.t(key))
        : (toolbar.menus ?? []);
    for (const def of menus) {
      this.toolbarMenuIds.add(def.id);
      this.toolbarPanel.defineMenu(def);
    }
  }

  /** Kernel undo/redo bar — always on; hotkeys already seeded in createPlatform. */
  private seedHistoryToolbar(): void {
    this.toolbarPanel.add({
      id: 'undo',
      icon: undoIcon,
      title: () => this.t('history.undo') || 'Undo',
      group: 'history',
      order: 1,
      command: 'undo',
    });
    this.toolbarPanel.add({
      id: 'redo',
      icon: redoIcon,
      title: () => this.t('history.redo') || 'Redo',
      group: 'history',
      order: 2,
      command: 'redo',
    });
  }

  notify(options: NotifyOptions | string): void {
    if (typeof options === 'string') {
      this.ui.notify.info(options);
    } else {
      this.ui.notify.show(options);
    }
  }

  listShortcuts(): { keys: string; description: string; category: string }[] {
    // Registered plugin hotkeys only (SDK contract). Kernel undo/redo listed from platform seed.
    const out: { keys: string; description: string; category: string }[] = [];
    const seen = new Set<string>();
    for (const s of this.platform.shortcuts) {
      if (s.command !== 'undo' && s.command !== 'redo') {
        continue;
      }
      const key = s.keys.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        keys: s.keys,
        description: s.command === 'undo' ? 'Undo' : 'Redo',
        category: 'Editing',
      });
    }
    for (const plugin of this.plugins) {
      for (const hk of plugin.hotkeys ?? []) {
        const key = hk.keys.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        out.push({
          keys: hk.keys,
          description: hk.description ?? hk.command,
          category: plugin.name,
        });
      }
      for (const s of plugin.shortcuts ?? []) {
        const key = s.keys.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        out.push({
          keys: s.keys,
          description: s.command,
          category: plugin.name,
        });
      }
    }
    return out;
  }

  getState(): EditorState {
    return this.state;
  }

  getJSON(): JSONDoc {
    return docToJSON(this.state.doc);
  }

  setJSON(json: JSONDoc | DocNode): void {
    const doc = docFromJSON(json);
    this.history.clear();
    this.state = createState(doc, this.state.selection);
    this.view.update(this.state);
    this.emit('docChanged');
  }

  /** Full-document replace with selection reset (prose HTML/MD loads). */
  replaceDocument(json: JSONDoc | DocNode): void {
    const doc = docFromJSON(json);
    this.history.clear();
    this.state = createState(doc);
    this.view.update(this.state);
    this.emit('docChanged');
  }

  getHTML(): string {
    if (this.ioOverrides.getHTML) {
      return this.ioOverrides.getHTML.call(this);
    }
    return '';
  }

  setHTML(html: string): void {
    if (this.ioOverrides.setHTML) {
      this.ioOverrides.setHTML.call(this, html);
      return;
    }
    // stub — do not throw
    void html;
  }

  getPublishedHTML(): string {
    if (this.ioOverrides.getPublishedHTML) {
      return this.ioOverrides.getPublishedHTML.call(this);
    }
    return '';
  }

  getPublishedJS(): string | null {
    if (this.ioOverrides.getPublishedJS) {
      return this.ioOverrides.getPublishedJS.call(this);
    }
    return null;
  }

  getPublishedDocument(): string {
    if (this.ioOverrides.getPublishedDocument) {
      return this.ioOverrides.getPublishedDocument.call(this);
    }
    return '';
  }

  getMarkdown(): string {
    if (this.ioOverrides.getMarkdown) {
      return this.ioOverrides.getMarkdown.call(this);
    }
    return '';
  }

  setMarkdown(md: string): void {
    if (this.ioOverrides.setMarkdown) {
      this.ioOverrides.setMarkdown.call(this, md);
      return;
    }
    void md;
  }

  private measure(name: string, fn: () => void, ctx?: { source?: string }): void {
    const sink = this.diagnostics?.onMeasure;
    if (!sink || typeof performance === 'undefined') {
      fn();
      return;
    }
    const t0 = performance.now();
    fn();
    const ms = performance.now() - t0;
    performance.mark?.(`ocm:${name}`);
    sink(name, ms, ctx);
  }

  dispatch(tr: Transaction, opts?: { source?: TransactionSource }): void {
    if (this.destroyed) {
      return;
    }
    const source: TransactionSource = opts?.source ?? 'local';
    const onlySelection = tr.ops.length > 0 && tr.ops.every((o) => o.type === 'set_selection');
    if (onlySelection) {
      this.state = applyTransaction(this.state, tr, this.platform.schema).state;
      this.projectSelection(this.state);
      this.emitTransaction(tr, source);
      this.emit('selectionChanged');
      return;
    }
    this.measure(
      'dispatch',
      () => {
        if (source === 'remote') {
          // Apply without touching local undo/redo stacks.
          this.state = applyTransaction(this.state, tr, this.platform.schema).state;
        } else {
          this.state = this.history.apply(this.state, tr);
        }
        this.measure('view.update', () => this.view.update(this.state), { source });
        this.measure('toolbar.refresh', () => this.toolbar.refresh(), { source });
      },
      { source }
    );
    this.emitTransaction(tr, source);
    this.emit('docChanged');
    this.emit('selectionChanged');
  }

  command(name: string): boolean {
    const cmd = this.platform.commands.get(name);
    if (!cmd) {
      return false;
    }
    const tr = runCommand(this.state, cmd);
    if (!tr) {
      return false;
    }
    this.dispatch(tr);
    return true;
  }

  run(command: Command): boolean {
    const tr = runCommand(this.state, command);
    if (!tr) {
      return false;
    }
    this.dispatch(tr);
    return true;
  }

  undo(): boolean {
    if (!this.history.canUndo()) {
      return false;
    }
    this.state = this.history.undo(this.state);
    this.view.update(this.state);
    this.emit('docChanged');
    return true;
  }

  redo(): boolean {
    if (!this.history.canRedo()) {
      return false;
    }
    this.state = this.history.redo(this.state);
    this.view.update(this.state);
    this.emit('docChanged');
    return true;
  }

  get schema() {
    return this.platform.schema;
  }

  on(
    event: 'docChanged' | 'selectionChanged' | 'transaction',
    cb: Listener | TransactionListener
  ): () => void {
    if (event === 'transaction') {
      const listener = cb as unknown as TransactionListener;
      this.transactionListeners.add(listener);
      return () => this.transactionListeners.delete(listener);
    }
    const stateListener = cb as unknown as Listener;
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(stateListener);
    return () => this.listeners.get(event)?.delete(stateListener);
  }

  private emitTransaction(tr: Transaction, source: TransactionSource): void {
    const event: TransactionEvent = { tr, source, state: this.state };
    for (const cb of this.transactionListeners) {
      cb(event);
    }
  }

  private emit(event: string): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    for (const cb of set) {
      cb(this.state);
    }
  }

  setSelection(selection: Selection): void {
    this.state = { ...this.state, selection: clampSelection(this.state.doc, selection) };
    this.projectSelection(this.state);
    this.emit('selectionChanged');
  }

  getSelection(): Selection {
    return this.state.selection;
  }

  getStoredMarks(): Mark[] {
    return this.storedMarks.map((m) => ({
      ...m,
      attrs: m.attrs ? { ...m.attrs } : undefined,
    }));
  }

  setStoredMarks(marks: Mark[]): void {
    this.storedMarks = marks.map((m) => ({
      ...m,
      attrs: m.attrs ? { ...m.attrs } : undefined,
    }));
  }

  getSoftDeleteMark(): Mark | null {
    if (!this.softDeleteMark) {
      return null;
    }
    return {
      ...this.softDeleteMark,
      attrs: this.softDeleteMark.attrs ? { ...this.softDeleteMark.attrs } : undefined,
    };
  }

  setSoftDeleteMark(mark: Mark | null): void {
    this.softDeleteMark = mark
      ? { ...mark, attrs: mark.attrs ? { ...mark.attrs } : undefined }
      : null;
  }

  /** Platform widgets for ViewPort factories (CE / Tree). */
  getWidgets(): Map<string, WidgetDefinition> {
    return this.platform.widgets;
  }

  /** Null after `destroy()` — for ViewPort editor accessors. */
  asAlive(): EditorAPI | null {
    return this.destroyed ? null : this;
  }

  /** Plugins at construct + `use()` — for prose publish IO in app shims. */
  listPlugins(): readonly PluginDefinition[] {
    return this.plugins.slice();
  }

  /** Apply chrome host tokens; track them so destroy can clear exactly what we added. */
  private applyHostChrome(): void {
    const tokens = editorChromeTv().host().split(/\s+/).filter(Boolean);
    if (this.chrome === 'page') {
      tokens.push('ocm-editor-root--page');
    }
    this.hostChromeClasses.push(...tokens);
    this.host.classList.add(...tokens);
  }

  private clearHostChrome(): void {
    if (this.hostChromeClasses.length === 0) {
      return;
    }
    this.host.classList.remove(...this.hostChromeClasses);
    this.hostChromeClasses.length = 0;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.host.removeEventListener('keydown', this.onHostKeydown);
    this.teardownColorScheme();
    this.pageChrome?.destroy();
    this.pageChrome = null;
    this.view.destroy();
    this.toolbarPanel.destroy();
    this.ui.popup.destroy();
    this.ui.contextMenu.destroy();
    this.ui.notify.destroy();
    clearPortalRoot(undefined, false);
    destroyPlatform(this.platform);
    this.listeners.clear();
    this.transactionListeners.clear();
    this.clearHostChrome();
  }
}
