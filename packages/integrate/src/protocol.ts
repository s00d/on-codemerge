import { createEditorHost } from '@codemerge/integrate';
import type { DocFormat, EditorHostHandle, HostOptions } from '@codemerge/integrate';

/** postMessage protocol for iframe / WebView / Electron / Tauri / Wails / Capacitor. */
export type OcmHostMessage =
  | { type: 'ocm-load'; format?: DocFormat; value: string }
  | { type: 'ocm-change'; format: DocFormat; value: string }
  | { type: 'ocm-destroy' }
  | { type: 'ocm-ready' };

export const OCM_MESSAGE_TYPES = ['ocm-load', 'ocm-change', 'ocm-destroy', 'ocm-ready'] as const;

export function isOcmHostMessage(data: unknown): data is OcmHostMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const type: unknown = Reflect.get(data, 'type');
  if (type === 'ocm-load' || type === 'ocm-change') {
    const format: unknown = Reflect.get(data, 'format');
    return (
      typeof Reflect.get(data, 'value') === 'string' &&
      (format === 'html' ||
        format === 'markdown' ||
        format === 'text' ||
        (type === 'ocm-load' && format === undefined))
    );
  }
  return type === 'ocm-destroy' || type === 'ocm-ready';
}

export interface HostBridgeOptions {
  /**
   * `postMessage` target origin. Default: the embedding parent's origin when framed
   * (`location.ancestorOrigins[0]`, else `document.referrer`), `'*'` when it cannot be read.
   */
  targetOrigin?: string;
  /**
   * Origins whose `ocm-load` / `ocm-destroy` are obeyed (`'*'` = any).
   * Default: `[targetOrigin]` when that is a concrete origin, else any.
   */
  allowedOrigins?: string[];
  messageSource?: Window;
  messageTarget?: Window | null;
}

/** Origin of the embedding parent, or null when not framed / unreadable. */
function parentOrigin(): string | null {
  if (window.parent === window) {
    return null;
  }
  const ancestor = window.location.ancestorOrigins?.[0];
  if (ancestor && ancestor !== 'null') {
    return ancestor;
  }
  try {
    return document.referrer ? new URL(document.referrer).origin : null;
  } catch {
    return null;
  }
}

/** Wire EditorHost to the iframe/WebView postMessage protocol. */
export function bindHostBridge(
  el: HTMLElement,
  options: HostBridgeOptions = {}
): { host: EditorHostHandle; dispose: () => void } {
  const source = options.messageSource ?? window;
  const target = options.messageTarget === undefined ? window.parent : options.messageTarget;
  // Framed with the default target: only the real parent window may drive the editor.
  const framedParent = target !== null && target === window.parent && target !== window;
  const origin = options.targetOrigin ?? (framedParent ? parentOrigin() : null) ?? '*';
  const allowed = options.allowedOrigins ?? (origin === '*' ? ['*'] : [origin]);

  const host = createEditorHost(el, {
    onChange: (value, format) => {
      target?.postMessage({ type: 'ocm-change', value, format } satisfies OcmHostMessage, origin);
    },
    onReady: () => {
      target?.postMessage({ type: 'ocm-ready' } satisfies OcmHostMessage, origin);
    },
  });

  const onMessage = (ev: MessageEvent) => {
    if (framedParent && ev.source !== target) {
      return;
    }
    if (!allowed.includes('*') && !allowed.includes(ev.origin)) {
      return;
    }
    if (!isOcmHostMessage(ev.data)) {
      return;
    }
    if (ev.data.type === 'ocm-load') {
      host.setValue(ev.data.value, ev.data.format);
    }
    if (ev.data.type === 'ocm-destroy') {
      host.destroy();
    }
  };

  source.addEventListener('message', onMessage);
  return {
    host,
    dispose: () => {
      source.removeEventListener('message', onMessage);
      host.destroy();
    },
  };
}

export type LoadedDoc = string | { value: string; format?: DocFormat };

export type PersistenceCallbacks = Omit<HostOptions, 'value' | 'onChange' | 'onReady'> & {
  load: () => LoadedDoc | Promise<LoadedDoc>;
  save: (value: string, format: DocFormat) => void | Promise<void>;
  debounceMs?: number;
  onError?: (error: unknown, phase: 'load' | 'save') => void;
};

export interface PersistenceHandle {
  host: EditorHostHandle;
  dispose: () => void;
  reload: () => Promise<void>;
  flush: () => Promise<void>;
}

export type PersistenceTarget = HTMLElement | EditorHostHandle;

type EditorLike = { on: (event: 'docChanged', cb: () => void) => () => void };

function isHostHandle(target: unknown): target is EditorHostHandle {
  if (typeof target !== 'object' || target === null) {
    return false;
  }
  return (
    typeof Reflect.get(target, 'getValue') === 'function' &&
    typeof Reflect.get(target, 'setValue') === 'function' &&
    typeof Reflect.get(target, 'destroy') === 'function' &&
    'element' in target &&
    'getEditor' in target
  );
}

function asEditorLike(editor: unknown): EditorLike {
  if (typeof editor !== 'object' || editor === null || !('on' in editor)) {
    throw new TypeError('bindPersistence: editor does not support on(docChanged)');
  }
  const on = Reflect.get(editor, 'on');
  if (typeof on !== 'function') {
    throw new TypeError('bindPersistence: editor does not support on(docChanged)');
  }
  return {
    on: (event, cb) => {
      const offUnknown: unknown = on.call(editor, event, cb);
      if (typeof offUnknown !== 'function') {
        return () => undefined;
      }
      return () => {
        Reflect.apply(offUnknown, undefined, []);
      };
    },
  };
}

function ocmHost(el: HTMLElement): EditorHostHandle | null {
  if (!('host' in el)) {
    return null;
  }
  const host = Reflect.get(el, 'host');
  return isHostHandle(host) ? host : null;
}

function normalizeLoaded(
  doc: LoadedDoc,
  fallback: DocFormat
): { value: string; format: DocFormat } {
  if (typeof doc === 'string') {
    return { value: doc, format: fallback };
  }
  return { value: doc.value, format: doc.format ?? fallback };
}

/** Wire load/save to a host, plain element, or ready `<ocm-editor>`. */
export function bindPersistence(
  target: PersistenceTarget,
  options: PersistenceCallbacks
): PersistenceHandle {
  const format = options.format ?? 'html';
  const debounceMs = options.debounceMs ?? 300;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  const changeListeners: Array<() => void> = [];
  const emitChange = (): void => {
    for (const cb of changeListeners) {
      cb();
    }
  };

  let host: EditorHostHandle;
  /** `<ocm-editor>` replaces its host on attribute/configure remount — always read the live one. */
  let currentHost = (): EditorHostHandle => host;
  let ownsHost: boolean;
  let offChange: () => void;

  if (isHostHandle(target)) {
    host = target;
    ownsHost = false;
    const off = asEditorLike(host.getEditor()).on('docChanged', emitChange);
    offChange = () => {
      off();
      changeListeners.length = 0;
    };
  } else if (target.localName === 'ocm-editor') {
    const existing = ocmHost(target);
    if (!existing) {
      throw new Error(
        'bindPersistence: <ocm-editor> is not ready — wait for the "ready" event, then bind'
      );
    }
    host = existing;
    currentHost = () => ocmHost(target) ?? existing;
    ownsHost = false;
    const off = asEditorLike(host.getEditor()).on('docChanged', emitChange);
    const onDom = (): void => {
      emitChange();
    };
    target.addEventListener('change', onDom);
    offChange = () => {
      off();
      target.removeEventListener('change', onDom);
      changeListeners.length = 0;
    };
  } else {
    const {
      load: _load,
      save: _save,
      debounceMs: _debounceMs,
      onError: _onError,
      ...hostOpts
    } = options;
    host = createEditorHost(target, {
      ...hostOpts,
      format,
      onChange: () => {
        emitChange();
      },
    });
    ownsHost = true;
    offChange = () => {
      changeListeners.length = 0;
    };
  }

  const runSave = async (): Promise<void> => {
    if (disposed) {
      return;
    }
    try {
      const live = currentHost();
      await options.save(live.getValue(), live.format);
    } catch (error) {
      options.onError?.(error, 'save');
    }
  };

  const scheduleSave = (): void => {
    if (disposed) {
      return;
    }
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      void runSave();
    }, debounceMs);
  };

  changeListeners.push(scheduleSave);

  const reload = async (): Promise<void> => {
    if (disposed) {
      return;
    }
    try {
      const loaded = normalizeLoaded(await options.load(), format);
      currentHost().setValue(loaded.value, loaded.format);
    } catch (error) {
      options.onError?.(error, 'load');
    }
  };

  const flush = async (): Promise<void> => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    await runSave();
  };

  void reload();

  return {
    get host() {
      return currentHost();
    },
    reload,
    flush,
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      offChange();
      if (ownsHost) {
        host.destroy();
      }
    },
  };
}

export type RestHttpMethod = 'GET' | 'PUT' | 'POST' | 'PATCH';

export interface RestPersistenceOptions {
  url: string | { load: string; save: string };
  method?: { load?: RestHttpMethod; save?: RestHttpMethod };
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  parse: (data: unknown) => LoadedDoc;
  serialize: (value: string, format: DocFormat) => unknown;
  fetch?: typeof globalThis.fetch;
  debounceMs?: number;
}

/** Build `{ load, save }` for bindPersistence from a custom REST endpoint. */
export function restPersistence(
  options: RestPersistenceOptions
): Pick<PersistenceCallbacks, 'load' | 'save' | 'debounceMs'> {
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const loadUrl = typeof options.url === 'string' ? options.url : options.url.load;
  const saveUrl = typeof options.url === 'string' ? options.url : options.url.save;
  const loadMethod = options.method?.load ?? 'GET';
  const saveMethod = options.method?.save ?? 'PUT';

  const resolveHeaders = async (): Promise<HeadersInit> => {
    const h = options.headers;
    if (typeof h === 'function') {
      return await h();
    }
    return h ?? {};
  };

  return {
    debounceMs: options.debounceMs,
    async load() {
      const res = await fetchImpl(loadUrl, {
        method: loadMethod,
        headers: await resolveHeaders(),
        credentials: 'same-origin',
      });
      if (!res.ok) {
        throw new Error(`load failed: ${res.status} ${res.statusText}`);
      }
      return options.parse(await res.json());
    },
    async save(value, format) {
      const headers = new Headers(await resolveHeaders());
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      const res = await fetchImpl(saveUrl, {
        method: saveMethod,
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(options.serialize(value, format)),
      });
      if (!res.ok) {
        throw new Error(`save failed: ${res.status} ${res.statusText}`);
      }
    },
  };
}
