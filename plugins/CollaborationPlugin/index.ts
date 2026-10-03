import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import { definePlugin, h, pluginToolbarPlacement } from '@codemerge/sdk';
import type { PluginToolbarOpts } from '@codemerge/sdk';
import type { Operation } from '@codemerge/kernel';
import { collaborationIcon } from '@ocm/wysiwyg/icons';
import { createCollabClient, type CollabClient } from './client.ts';
import type { CollabStatus, PresencePeer } from './protocol.ts';
import { renderPresenceOverlay } from './presence-ui.ts';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

export type { CollabStatus, PresencePeer } from './protocol.ts';
export {
  createOpsCollabBinding,
  createCollabClient,
  type CollabClient,
  type OpsCollabBinding,
} from './client.ts';
export { createCommentThread, createCommentsState } from './comments.ts';

export interface CollaborationPluginOptions extends PluginToolbarOpts {
  /** WebSocket URL (default `ws://localhost:8080/collab`) */
  serverUrl?: string;
  autoStart?: boolean;
  /**
   * Shared secret for static auth (dev). Prefer `getToken` for production.
   * @deprecated use getToken
   */
  token?: string;
  /** Async/sync token provider (JWT or static) */
  getToken?: () => Promise<string> | string;
  docId?: string;
  user?: { id?: string; name?: string; color?: string };
  onStatus?: (s: CollabStatus) => void;
  onPresence?: (peers: PresencePeer[]) => void;
  onBroadcast?: (ops: Operation[]) => void;
  offlineQueue?: boolean;
}

function generateToken(length = 8): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters.charAt((bytes[i] ?? 0) % characters.length);
  }
  return token;
}

const USER_STORAGE_KEY = 'ocm.collab.userId';

/** Room link: only `docId`. Never put client identity in a shareable URL. */
function buildShareUrl(docId: string | null): string {
  if (!globalThis.location) {
    return docId ? `?docId=${encodeURIComponent(docId)}` : '#';
  }
  const url = new URL(globalThis.location.href);
  url.searchParams.delete('userId');
  if (docId) {
    url.searchParams.set('docId', docId);
  } else {
    url.searchParams.delete('docId');
  }
  return url.toString();
}

function resolveUserId(explicit?: string): string {
  if (explicit) {
    return explicit;
  }
  try {
    const stored = globalThis.sessionStorage?.getItem(USER_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  } catch {
    /* private mode */
  }
  const id = generateToken(12);
  try {
    globalThis.sessionStorage?.setItem(USER_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

function syncRoomUrl(docId: string): void {
  if (!globalThis.location || !globalThis.history) {
    return;
  }
  const url = new URL(globalThis.location.href);
  url.searchParams.set('docId', docId);
  // Identity must never live in the shareable query string.
  url.searchParams.delete('userId');
  const next = url.toString();
  if (next !== globalThis.location.href) {
    globalThis.history.replaceState({}, '', next);
  }
}

export type CollaborationHandle = {
  start: () => void;
  stop: () => void;
  getStatus: () => CollabStatus;
  getPeers: () => PresencePeer[];
  forceResync: () => void;
};

const handles = new WeakMap<object, CollaborationHandle>();

/** Retrieve the live collab handle for an editor instance (if plugin started). */
export function getCollaborationHandle(editor: object): CollaborationHandle | null {
  return handles.get(editor) ?? null;
}

/**
 * Opt-in realtime collaboration (protocol v2 — authoritative op-log).
 * Not included in `createDefaultPlugins`.
 */
export function CollaborationPlugin(options: CollaborationPluginOptions = {}) {
  const { menu, group, order, ...rest } = options;
  const toolbarOpts: PluginToolbarOpts = {
    ...(menu !== undefined ? { menu } : {}),
    ...(group !== undefined ? { group } : {}),
    ...(order !== undefined ? { order } : {}),
  };

  let openCollab: (() => void) | null = null;

  return definePlugin({
    name: 'collaboration',
    hotkeys: [{ keys: 'Mod-Alt-o', command: 'openCollaboration', description: 'Collaboration' }],
    commands: {
      openCollaboration: () => {
        openCollab?.();
        return null;
      },
    },
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      const editor = ctx.editor;
      const urlParams = new URLSearchParams(globalThis.location?.search ?? '');
      // userId is local identity (opts / sessionStorage) — never taken from share URL.
      const userId = resolveUserId(rest.user?.id);
      let docId: string | null = rest.docId ?? urlParams.get('docId');
      let status: CollabStatus = 'idle';
      let peers: PresencePeer[] = [];
      let client: CollabClient | null = null;
      let disposePresence: (() => void) | null = null;

      // Drop legacy ?userId= from the address bar so copy-paste can't clone identity.
      if (urlParams.has('userId') && globalThis.location && globalThis.history) {
        const cleaned = new URL(globalThis.location.href);
        cleaned.searchParams.delete('userId');
        globalThis.history.replaceState({}, '', cleaned.toString());
      }

      const getToken = async () => {
        if (rest.getToken) {
          return rest.getToken();
        }
        return rest.token ?? '';
      };

      const refreshPresenceUi = () => {
        disposePresence?.();
        const host = editor.contentElement() ?? editor.host;
        disposePresence = renderPresenceOverlay(host, peers);
      };

      const ensureDocId = () => {
        if (!docId) {
          docId = generateToken(12);
        }
        syncRoomUrl(docId);
        return docId;
      };

      let popupHandle: ReturnType<typeof ctx.popup.open> | null = null;

      const buildPopupOptions = (): Parameters<typeof ctx.popup.open>[0] => {
        const serverUrl = rest.serverUrl ?? 'ws://localhost:8080/collab';
        return {
          title: editor.t('collaboration.title'),
          closeOnClickOutside: false,
          items: [
            {
              type: 'view',
              id: 'collaboration-content',
              view: () =>
                h('div', { class: 'collaboration-content flex flex-col gap-2 p-4' }, [
                  h(
                    'p',
                    { class: 'collab-status font-medium' },
                    `${editor.t('common.status')}: ${status}`
                  ),
                  h('p', { class: 'text-sm break-all' }, `server: ${serverUrl}`),
                  h('p', { class: 'text-sm' }, `${editor.t('common.user')}: ${userId}`),
                  h('p', { class: 'text-sm' }, `docId: ${docId ?? '—'}`),
                  h('p', { class: 'text-sm' }, `peers: ${peers.length}`),
                  h(
                    'a',
                    {
                      class: 'text-sm text-sky-700 underline break-all',
                      attrs: {
                        href: buildShareUrl(docId),
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      },
                    },
                    editor.t('common.shareThisLink')
                  ),
                  h(
                    'p',
                    { class: 'text-xs text-gray-500 break-all' },
                    docId ? buildShareUrl(docId) : '—'
                  ),
                  h(
                    'p',
                    { class: 'text-sm text-gray-500' },
                    editor.t('collaboration.localDemoOnlyPassToken')
                  ),
                ]),
            },
          ],
          buttons: [
            {
              label: editor.t('common.startCollaboration'),
              variant: 'primary',
              onClick: () => start(),
            },
            {
              label: 'Stop',
              onClick: () => stop(),
            },
          ],
        };
      };

      const refreshChrome = () => {
        refreshPopup();
        editor.toolbar.refresh();
      };

      const statusLabel = (): string => {
        switch (status) {
          case 'connecting':
          case 'authenticating':
            return editor.t('collaboration.statusConnecting');
          case 'syncing':
            return editor.t('collaboration.statusSyncing');
          case 'synced':
            return editor.t('collaboration.statusSynced');
          case 'reconnecting':
            return editor.t('collaboration.statusReconnecting');
          case 'offline':
            return editor.t('collaboration.statusOffline');
          case 'error':
            return editor.t('collaboration.statusError');
          case 'readonly':
            return editor.t('collaboration.statusReadonly');
          default:
            return editor.t('collaboration.statusIdle');
        }
      };

      const statusDotClass = (): string => {
        switch (status) {
          case 'synced':
            return 'ocm-collab-status__dot is-live';
          case 'readonly':
            return 'ocm-collab-status__dot is-view';
          case 'error':
            return 'ocm-collab-status__dot is-error';
          case 'connecting':
          case 'authenticating':
          case 'syncing':
          case 'reconnecting':
          case 'offline':
            return 'ocm-collab-status__dot is-busy';
          default:
            return 'ocm-collab-status__dot';
        }
      };

      const statusTitle = (): string => {
        const base = `${editor.t('common.status')}: ${statusLabel()}`;
        if (peers.length === 0) {
          return base;
        }
        return `${base} · ${editor.t('collaboration.peersCount').replace('{n}', String(peers.length))}`;
      };

      const statusChip = () =>
        h(
          'button',
          {
            class: 'ocm-collab-status',
            attrs: {
              type: 'button',
              'data-collab-state': status,
              title: statusTitle(),
              'aria-label': statusTitle(),
            },
            on: {
              click: () => openCollab?.(),
            },
          },
          [
            h('span', {
              class: 'ocm-collab-status__icon',
              props: { innerHTML: collaborationIcon },
            }),
            h('span', { class: statusDotClass() }),
            h('span', { class: 'ocm-collab-status__label' }, statusLabel()),
            peers.length > 0
              ? h('span', { class: 'ocm-collab-status__peers' }, String(peers.length))
              : null,
          ]
        );

      const refreshPopup = () => {
        if (!popupHandle) {
          return;
        }
        popupHandle.update(buildPopupOptions());
      };

      const start = () => {
        void (async () => {
          const token = await getToken();
          if (!token) {
            editor.notify(editor.t('common.collaborationRequiresATokenMatchingCollabToken'));
            return;
          }
          const id = ensureDocId();
          client?.stop();
          client = createCollabClient({
            serverUrl: rest.serverUrl ?? 'ws://localhost:8080/collab',
            getToken,
            docId: id,
            user: {
              id: userId,
              name: rest.user?.name,
              color: rest.user?.color ?? '#2563eb',
            },
            editor,
            offlineQueue: rest.offlineQueue,
            onBroadcast: rest.onBroadcast,
            onStatus: (s) => {
              status = s;
              rest.onStatus?.(s);
              refreshChrome();
            },
            onPresence: (p) => {
              peers = p;
              rest.onPresence?.(p);
              refreshPresenceUi();
              refreshChrome();
            },
          });
          const handle: CollaborationHandle = {
            start: () => client?.start(),
            stop: () => client?.stop(),
            getStatus: () => client?.getStatus() ?? status,
            getPeers: () => client?.getPeers() ?? peers,
            forceResync: () => client?.forceResync(),
          };
          handles.set(editor, handle);
          client.start();
          editor.notify(editor.t('common.collaborationConnected'));
        })();
      };

      const stop = () => {
        client?.stop();
        client = null;
        disposePresence?.();
        disposePresence = null;
        status = 'idle';
        peers = [];
        refreshChrome();
      };

      openCollab = () => {
        popupHandle = ctx.popup.open(buildPopupOptions());
      };

      ctx.toolbar.add({
        id: 'collaboration',
        icon: collaborationIcon,
        title: () => editor.t('collaboration.title'),
        ...pluginToolbarPlacement({ menu: 'review', order: 70 }, toolbarOpts),
        onClick: () => openCollab?.(),
      });

      // Trailing sync chip — always visible when the plugin is loaded.
      ctx.toolbar.add({
        id: 'collaboration-status',
        align: 'end',
        group: 'collab',
        order: 10,
        title: () => statusTitle(),
        view: () => statusChip(),
      });

      ctx.disposable(() => {
        stop();
        handles.delete(editor);
      });

      // Share links (?docId=) connect automatically when a token is configured.
      // Explicit autoStart:false disables that; autoStart:true also starts without docId.
      const hasDoc = Boolean(rest.docId || urlParams.get('docId'));
      const hasAuth = Boolean(rest.token || rest.getToken);
      if (hasAuth && (rest.autoStart === true || (rest.autoStart !== false && hasDoc))) {
        start();
      }
    },
  });
}
