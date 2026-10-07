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
  return (
    type === 'ocm-load' || type === 'ocm-change' || type === 'ocm-destroy' || type === 'ocm-ready'
  );
}

export interface HostBridgeOptions {
  targetOrigin?: string;
  messageSource?: Window;
  messageTarget?: Window | null;
}

/** Wire EditorHost to the iframe/WebView postMessage protocol. */
export function bindHostBridge(
  el: HTMLElement,
  options: HostBridgeOptions = {}
): { host: EditorHostHandle; dispose: () => void } {
  const origin = options.targetOrigin ?? '*';
  const source = options.messageSource ?? window;
  const target = options.messageTarget === undefined ? window.parent : options.messageTarget;

  const host = createEditorHost(el, {
    onChange: (value, format) => {
      target?.postMessage({ type: 'ocm-change', value, format } satisfies OcmHostMessage, origin);
    },
    onReady: () => {
      target?.postMessage({ type: 'ocm-ready' } satisfies OcmHostMessage, origin);
    },
  });

  const onMessage = (ev: MessageEvent) => {
    if (
      options.targetOrigin &&
      options.targetOrigin !== '*' &&
      ev.origin !== options.targetOrigin
    ) {
      return;
    }
    if (!isOcmHostMessage(ev.data)) {
      return;
    }
    if (ev.data.type === 'ocm-load') {
      host.setValue(ev.data.value);
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
      await options.save(host.getValue(), host.format);
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
      host.setValue(normalizeLoaded(await options.load(), format).value);
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
    host,
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
