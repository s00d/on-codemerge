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
} from '@on-codemerge/kernel';
import type {
  DocNode,
  JSONDoc,
  Selection,
  EditorState,
  Transaction,
  HistoryController,
  Command,
  Mark,
} from '@on-codemerge/kernel';
import { EditorView } from '../view/EditorView';
import { InputBridge } from '../view/InputBridge';
import {
  createPlatform,
  destroyPlatform,
  registerPlugin,
  runExtensionSetup,
} from '../platform/Extension';
import type { Platform } from '../platform/Extension';
import { exportHTML, importHTML, exportMarkdown, importMarkdown, exportPublishedHTML } from '../io';
import {
  ContextMenuService,
  NotifyService,
  PopupService,
  ToolbarPanel,
  clearPortalRoot,
  collectPublishNodes,
  composePublishedDocument,
  neededRuntimeIds,
  publishedCssHref,
  publishedJsHref,
} from '@on-codemerge/sdk';
import type { EditorAPI, LocaleMessages, NotifyOptions, PluginDefinition } from '@on-codemerge/sdk';
import { editorChromeTv } from '@on-codemerge/sdk/ui/chrome';
import { createI18n } from '@i18n-micro/runtime';
import type { I18n, Params, Translations } from '@i18n-micro/runtime';
import en from '../i18n/locales/en.json';
import { listLocales, loadLocale } from '../i18n/loadLocale';
import { commentIcon, insertIcon, shortcutsIcon } from '../icons';
import { PageChrome } from './PageChrome';

export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  /** Initial locale (loaded async if not `en` / not already in `messages`). */
  locale?: string;
  fallbackLocale?: string;
  /** Extra locale messages available at bootstrap (merged with bundled `en`). */
  messages?: Record<string, Translations>;
  /**
   * `host` (default) — do not touch `<html>` (page owns `class="dark"`).
   * `system` — sync `prefers-color-scheme` to `documentElement.classList` `dark` only.
   */
  colorScheme?: 'host' | 'system';
  /**
   * `bar` (default) — sticky toolbar + footer.
   * `page` — content fills the host; toolbar/footer hidden; same toolbar opens in a popup on click.
   */
  chrome?: 'bar' | 'page';
}

type Listener = (state: EditorState) => void;
type LocaleLoader = () => Promise<LocaleMessages>;

export class Editor implements EditorAPI {
  readonly host: HTMLElement;
  readonly chrome: 'bar' | 'page';
  private state: EditorState;
  private readonly view: EditorView;
  private readonly bridge: InputBridge;
  private readonly history: HistoryController;
  private readonly platform: Platform;
  private readonly plugins: PluginDefinition[];
  private readonly listeners = new Map<string, Set<Listener>>();
  private destroyed = false;
  private readonly i18n: I18n;
  private readonly loadedLocales = new Set<string>();
  private readonly localeLoaders = new Map<string, LocaleLoader>();
  private readonly localeChangeListeners = new Set<() => void>();
  private readonly localeReady: Promise<void> = Promise.resolve();
  private readonly toolbarPanel: ToolbarPanel;
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

  constructor(host: HTMLElement, options: EditorOptions = {}) {
    this.host = host;
    this.host.classList.add(...editorChromeTv().host().split(/\s+/).filter(Boolean));
    this.chrome = options.chrome ?? 'bar';
    if (this.chrome === 'page') {
      this.host.classList.add('ocm-editor-root--page');
    }
    this.colorScheme = options.colorScheme ?? 'host';
    this.plugins = options.plugins ?? [];
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
    if (initialLocale !== 'en') {
      this.localeReady = this.setLocale(initialLocale);
    }

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
      add: (btn) => this.toolbarPanel.add(btn),
      defineMenu: (def) => this.toolbarPanel.defineMenu(def),
      refresh: () => {
        this.toolbarPanel.refresh();
      },
      remove: (id) => {
        this.toolbarPanel.remove(id);
      },
    };
    this.registerDefaultMenus();

    const contextMenu = new ContextMenuService(host);
    const popup = new PopupService(host);
    this.ui = {
      contextMenu,
      menu: contextMenu,
      notify: new NotifyService(host, popup),
      popup,
    };

    this.view = new EditorView(host, this.state, {}, this.platform.widgets);
    this.view.setEditorAccessor(() => (this.destroyed ? null : this));
    this.bridge = new InputBridge(
      this.view.content,
      () => this.state,
      (tr) => {
        this.dispatch(tr);
      },
      () => this.view.isProjecting,
      () => ({
        storedMarks: this.storedMarks,
        softDelete: this.softDeleteMark,
      })
    );

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
    runExtensionSetup(this.platform, this.plugins, this, (target) => {
      if (target === 'content') {
        return this.view.content;
      }
      return this.host;
    });
    this.setupColorScheme();
    if (this.chrome === 'page') {
      this.pageChrome = new PageChrome(this.view.content, this.toolbarPanel);
      this.pageChrome.start();
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
    this.host.addEventListener('keydown', (e) => {
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
      e.preventDefault();
      if (hit.command === 'undo') {
        this.undo();
      } else if (hit.command === 'redo') {
        this.redo();
      } else {
        this.command(hit.command);
      }
    });
  }

  use(plugin: PluginDefinition): void {
    registerPlugin(this.platform, plugin, this);
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
   * Built-in packs live in `src/i18n/locales/*.json` and load on demand.
   */
  async setLocale(locale: string): Promise<void> {
    if (!this.loadedLocales.has(locale)) {
      const custom = this.localeLoaders.get(locale);
      const dict = custom ? await custom() : await loadLocale(locale);
      if (dict !== null) {
        this.i18n.addTranslations(locale, dict, true);
        this.loadedLocales.add(locale);
      }
    }
    this.i18n.locale = locale;
    this.registerDefaultMenus();
    this.toolbarPanel.refresh();
    for (const cb of this.localeChangeListeners) {
      cb();
    }
  }

  /** Resolves when the constructor `locale` option (if non-en) has finished loading. */
  whenLocaleReady(): Promise<void> {
    return this.localeReady;
  }

  registerLocale(locale: string, dict: LocaleMessages): void {
    this.i18n.addTranslations(locale, dict, true);
    this.loadedLocales.add(locale);
  }

  registerLocaleLoader(locale: string, loader: LocaleLoader): void {
    this.localeLoaders.set(locale, loader);
  }

  onLocaleChange(cb: () => void): () => void {
    this.localeChangeListeners.add(cb);
    return () => {
      this.localeChangeListeners.delete(cb);
    };
  }

  /** Standard overflow menus — always present; empty menus hide their trigger. */
  private registerDefaultMenus(): void {
    this.toolbarPanel.defineMenu({
      id: 'insert',
      label: this.t('common.insert'),
      title: this.t('common.insert'),
      icon: insertIcon,
      group: 'insert',
      order: 40,
    });
    this.toolbarPanel.defineMenu({
      id: 'review',
      label: this.t('common.review'),
      title: this.t('common.review'),
      icon: commentIcon,
      group: 'review',
      order: 50,
    });
    this.toolbarPanel.defineMenu({
      id: 'tools',
      label: this.t('common.tools'),
      title: this.t('common.tools'),
      icon: shortcutsIcon,
      group: 'tools',
      order: 60,
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
    const out: { keys: string; description: string; category: string }[] = [
      { keys: 'Mod-B', description: 'Bold', category: 'Editing' },
      { keys: 'Mod-I', description: 'Italic', category: 'Editing' },
      { keys: 'Mod-Z', description: 'Undo', category: 'Editing' },
      { keys: 'Mod-Y', description: 'Redo', category: 'Editing' },
      { keys: 'Mod-Shift-Z', description: 'Redo', category: 'Editing' },
    ];
    const seen = new Set(out.map((s) => s.keys.toLowerCase()));
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
    this.state = createState(doc, this.state.selection);
    this.view.update(this.state);
    this.emit('docChanged');
  }

  getHTML(): string {
    return exportHTML(this.state.doc);
  }

  setHTML(html: string): void {
    const doc = importHTML(html);
    this.state = createState(doc);
    this.view.update(this.state);
    this.emit('docChanged');
  }

  getPublishedHTML(): string {
    return exportPublishedHTML(this.state.doc, collectPublishNodes(this.plugins));
  }

  getPublishedJS(): string | null {
    const html = this.getPublishedHTML();
    return neededRuntimeIds(html).length > 0 ? publishedJsHref() : null;
  }

  getPublishedDocument(): string {
    const bodyHtml = this.getPublishedHTML();
    return composePublishedDocument({
      bodyHtml,
      cssHref: publishedCssHref(),
      jsHref: neededRuntimeIds(bodyHtml).length > 0 ? publishedJsHref() : null,
    });
  }

  getMarkdown(): string {
    return exportMarkdown(this.state.doc);
  }

  setMarkdown(md: string): void {
    const doc = importMarkdown(md);
    this.state = createState(doc);
    this.view.update(this.state);
    this.emit('docChanged');
  }

  dispatch(tr: Transaction): void {
    if (this.destroyed) {
      return;
    }
    const onlySelection = tr.ops.length > 0 && tr.ops.every((o) => o.type === 'set_selection');
    if (onlySelection) {
      this.state = applyTransaction(this.state, tr, this.platform.schema).state;
      this.view.updateSelection(this.state);
      this.emit('selectionChanged');
      return;
    }
    this.state = this.history.apply(this.state, tr);
    this.view.update(this.state);
    this.toolbar.refresh();
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

  on(event: 'docChanged' | 'selectionChanged', cb: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
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
    this.view.updateSelection(this.state);
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

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.teardownColorScheme();
    this.pageChrome?.destroy();
    this.pageChrome = null;
    this.bridge.destroy();
    this.view.destroy();
    this.toolbarPanel.destroy();
    this.ui.popup.destroy();
    this.ui.contextMenu.destroy();
    this.ui.notify.destroy();
    clearPortalRoot(undefined, false);
    destroyPlatform(this.platform);
    this.listeners.clear();
  }
}
