import { definePlugin, h, core } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import type { Operation, DocNode, Transaction } from '@on-codemerge/kernel';
import { collaborationIcon } from '../../icons';

interface CollaborationPluginOptions {
  serverUrl?: string;
  autoStart?: boolean;
  /** Shared secret matching server `COLLAB_TOKEN` (required for join/ops). */
  token?: string;
  onBroadcast?: (ops: Operation[]) => void;
}

export interface OpsCollabBinding {
  applyRemote(ops: Operation[]): DocNode;
  getDoc(): DocNode;
  onLocal(ops: Operation[]): void;
}

function isDocNode(v: unknown): v is DocNode {
  return typeof v === 'object' && v !== null && 'type' in v && typeof v.type === 'string';
}

function parseCollabWireMessage(raw: unknown): {
  type: string;
  ops?: Operation[];
  snapshot?: DocNode;
} | null {
  if (typeof raw !== 'object' || raw === null || !('type' in raw)) {
    return null;
  }
  const typeVal = raw.type;
  if (typeof typeVal !== 'string') {
    return null;
  }
  const out: { type: string; ops?: Operation[]; snapshot?: DocNode } = { type: typeVal };
  if ('ops' in raw && Array.isArray(raw.ops)) {
    out.ops = raw.ops;
  }
  if ('snapshot' in raw && isDocNode(raw.snapshot)) {
    out.snapshot = raw.snapshot;
  }
  return out;
}

export function createOpsCollabBinding(
  initial: DocNode,
  broadcast: (ops: Operation[]) => void = () => {}
): OpsCollabBinding {
  let doc = initial;
  const selection = {
    anchor: { offset: 0, path: [0] },
    focus: { offset: 0, path: [0] },
  };
  return {
    applyRemote(ops) {
      doc = core.normalize(core.applyOps(doc, ops, selection).doc);
      return doc;
    },
    getDoc: () => doc,
    onLocal(ops) {
      doc = core.normalize(core.applyOps(doc, ops, selection).doc);
      broadcast(ops);
    },
  };
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

/**
 * Opt-in realtime collaboration (ops protocol).
 * Not included in `createDefaultPlugins` — pass `token` matching server `COLLAB_TOKEN`.
 */
export function CollaborationPlugin(options: CollaborationPluginOptions = {}) {
  const opts = {
    serverUrl: 'ws://localhost:8080',
    autoStart: false,
    token: '',
    ...options,
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
      const editor = ctx.editor;
      const urlParams = new URLSearchParams(globalThis.location.search);
      const userId = urlParams.get('userId') ?? generateToken();
      let ws: WebSocket | null = null;
      let docId: string | null = urlParams.get('docId');
      let status = 'Disconnected';
      let applyingRemote = false;
      let binding = createOpsCollabBinding(core.docFromJSON(editor.getJSON()), opts.onBroadcast);

      const send = (payload: Record<string, unknown>) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          return;
        }
        ws.send(JSON.stringify({ ...payload, token: opts.token, userId, docId }));
      };

      const prevDispatch = editor.dispatch.bind(editor);
      editor.dispatch = (tr: Transaction) => {
        prevDispatch(tr);
        if (applyingRemote || !ws || ws.readyState !== WebSocket.OPEN || !docId) {
          return;
        }
        const ops = tr.ops.filter((o) => o.type !== 'set_selection');
        if (ops.length === 0) {
          return;
        }
        binding.onLocal(ops);
        send({ type: 'ops', ops, snapshot: binding.getDoc() });
      };

      const startCollaboration = (api: EditorAPI) => {
        if (!opts.token) {
          api.notify(api.t('common.collaborationRequiresATokenMatchingCollabToken'));
          return;
        }
        if (!docId) {
          docId = generateToken(12);
          const url = new URL(globalThis.location.href);
          url.searchParams.set('docId', docId);
          url.searchParams.set('userId', userId);
          globalThis.history.replaceState({}, '', url.toString());
        }
        try {
          ws?.close();
          binding = createOpsCollabBinding(core.docFromJSON(api.getJSON()), opts.onBroadcast);
          ws = new WebSocket(`${opts.serverUrl}?docId=${docId}&userId=${userId}`);
          ws.addEventListener('open', () => {
            status = 'Connected';
            send({ type: 'join', snapshot: binding.getDoc() });
            api.notify(api.t('common.collaborationConnected'));
          });
          ws.addEventListener('message', (ev) => {
            try {
              const parsed: unknown = JSON.parse(String(ev.data));
              const msg = parseCollabWireMessage(parsed);
              if (!msg) {
                return;
              }
              if (msg.type === 'init' && msg.snapshot) {
                applyingRemote = true;
                try {
                  binding = createOpsCollabBinding(msg.snapshot, opts.onBroadcast);
                  api.setJSON(msg.snapshot);
                } finally {
                  applyingRemote = false;
                }
                return;
              }
              if (msg.type === 'ops' && Array.isArray(msg.ops)) {
                applyingRemote = true;
                try {
                  binding.applyRemote(msg.ops);
                  api.setJSON({ type: 'doc', content: binding.getDoc().content });
                } finally {
                  applyingRemote = false;
                }
              }
            } catch {
              /* ignore */
            }
          });
          ws.addEventListener('close', () => {
            status = 'Disconnected';
          });
        } catch {
          api.notify(api.t('common.failedToConnect'));
        }
      };

      openCollab = () => {
        ctx.popup.open({
          title: editor.t('collaboration.title'),
          closeOnClickOutside: false,
          items: [
            {
              type: 'view',
              id: 'collaboration-content',
              view: () =>
                h('div', { class: 'collaboration-content p-4' }, [
                  h('p', { class: 'collab-status' }, `${editor.t('common.status')}: ${status}`),
                  h('p', null, `${editor.t('common.user')}: ${userId}`),
                  h(
                    'a',
                    { attrs: { href: globalThis.location.href, target: '_blank' } },
                    editor.t('common.shareThisLink')
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
              onClick: () => {
                startCollaboration(editor);
              },
            },
          ],
        });
      };

      ctx.toolbar.add({
        id: 'collaboration',
        icon: collaborationIcon,
        title: editor.t('collaboration.title'),
        menu: 'review',
        order: 70,
        onClick: () => openCollab?.(),
      });

      ctx.disposable(() => {
        ws?.close();
        editor.dispatch = prevDispatch;
      });

      if (opts.autoStart && docId && opts.token) {
        startCollaboration(editor);
      }
    },
  });
}
