import type { EditorAPI } from './types';
import { DisposableScope } from './disposable';
import type { DisposeFn, Ownable } from './disposable';
import type { ToolbarButton, ToolbarMenuDef } from './ui/toolbar';
import { PopupController } from './ui/popup';
import type { PopupOptions, PopupHandle } from './ui/popup';
import type { MenuItem, MenuPosition } from './ui/context-menu';
import type { NotifyOptions } from './ui/notify';
import type { MountHandle, ViewSpec } from './ui/view';
import { mount as mountView } from './ui/view';

export type DomTarget = 'content' | 'chrome' | 'host';

export type { Ownable };

export interface PluginContext {
  readonly editor: EditorAPI;
  readonly scope: DisposableScope;
  readonly name: string;

  /** Subscribe to editor events; auto-unsubscribed on dispose. */
  on(event: 'docChanged' | 'selectionChanged', cb: (state: unknown) => void): DisposeFn;

  /** DOM listener on editor surfaces; auto-removed on dispose. */
  onDom<K extends keyof HTMLElementEventMap>(
    target: DomTarget,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): DisposeFn;

  toolbar: {
    add: (btn: ToolbarButton) => DisposeFn;
    defineMenu: (def: ToolbarMenuDef) => DisposeFn;
  };

  popup: {
    /** Open once; auto-hidden when plugin scope disposes (not for replaceable UI). */
    open: (options: PopupOptions) => PopupHandle;
    /**
     * Replaceable popup session bound to this plugin scope.
     * `open` auto-closes the previous; scope dispose closes the current.
     * Prefer for menus/modals instead of storing handles + destroy().
     */
    session: () => PopupController;
  };

  menu: {
    open: (items: MenuItem[], pos: MenuPosition | number, y?: number) => void;
  };

  notify: (options: NotifyOptions | string) => void;

  interval: (ms: number, fn: () => void) => DisposeFn;
  timeout: (ms: number, fn: () => void) => DisposeFn;
  disposable: (fn: DisposeFn) => DisposeFn;
  child: () => DisposableScope;

  /**
   * Register a resource for automatic teardown when the plugin scope disposes.
   * Calls `destroy()` → else `dispose()` → else `hide()`. Prefer this over
   * manual `ctx.disposable(() => menu.destroy())`.
   */
  own: <T extends Ownable>(resource: T) => T;

  /**
   * Fire-and-forget async work with error logging.
   * Prefer over `void promise` / floating promises in toolbar handlers.
   */
  defer: (task: Promise<unknown> | (() => Promise<unknown>)) => void;

  /** Mount ViewSpec into a core-owned host element (widget / chrome). */
  mount: (parent: HTMLElement, spec: ViewSpec) => MountHandle;

  /**
   * Insert a core-owned ViewSpec host as a sibling of the editor host.
   * Plugins must not createElement for chrome slots.
   */
  insertSibling: (position: 'before' | 'after', spec: ViewSpec) => MountHandle;
}

export type CreatePluginContextOptions = {
  editor: EditorAPI;
  name: string;
  /** Resolve DOM targets for onDom. */
  resolveTarget: (target: DomTarget) => EventTarget;
};

export function createPluginContext(opts: CreatePluginContextOptions): PluginContext {
  const scope = new DisposableScope();
  const { editor, name, resolveTarget } = opts;

  const ctx: PluginContext = {
    editor,
    scope,
    name,
    on(event, cb) {
      const off = editor.on(event, cb);
      return scope.disposable(off);
    },
    onDom(target, type, listener, options) {
      return scope.on(resolveTarget(target), type, listener, options);
    },
    toolbar: {
      add(btn) {
        const off = editor.toolbar.add(btn);
        return scope.disposable(off);
      },
      defineMenu(def) {
        const off = editor.toolbar.defineMenu(def);
        return scope.disposable(off);
      },
    },
    popup: {
      open(options) {
        const handle = editor.ui.popup.open(options);
        scope.disposable(() => {
          handle.hide();
        });
        return handle;
      },
      session() {
        return new PopupController((options) => editor.ui.popup.open(options), scope);
      },
    },
    menu: {
      open(items, pos, y) {
        if (typeof pos === 'number') {
          editor.ui.menu.open(items, { x: pos, y: y ?? 0 });
        } else {
          editor.ui.menu.open(items, pos);
        }
      },
    },
    notify(options) {
      editor.notify(options);
    },
    interval: (ms, fn) => scope.interval(ms, fn),
    timeout: (ms, fn) => scope.timeout(ms, fn),
    disposable: (fn) => scope.disposable(fn),
    child: () => scope.child(),
    own(resource) {
      return scope.own(resource);
    },
    defer(task) {
      void (async () => {
        try {
          await (typeof task === 'function' ? task() : task);
        } catch (error) {
          console.error(`[plugin:${name}] deferred task failed`, error);
        }
      })();
    },
    mount(parent, spec) {
      const handle = mountView(parent, spec);
      scope.disposable(() => {
        handle.destroy();
      });
      return handle;
    },
    insertSibling(position, spec) {
      const parent = editor.host.parentElement;
      const holder = document.createElement('div');
      if (parent) {
        if (position === 'before') {
          editor.host.before(holder);
        } else {
          editor.host.after(holder);
        }
      } else {
        editor.host.insertAdjacentElement(
          position === 'before' ? 'beforebegin' : 'afterend',
          holder
        );
      }
      const handle = mountView(holder, spec);
      scope.disposable(() => {
        handle.destroy();
        holder.remove();
      });
      return handle;
    },
  };

  return ctx;
}
