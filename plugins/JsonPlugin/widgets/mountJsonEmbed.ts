import { h, mount } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle } from '@codemerge/sdk';
import { bracesIcon, listIcon } from '@ocm/wysiwyg/icons';
import { mountJsonWorkspace } from '../surface/workspaceView';
import type { JsonWorkspaceHandle } from '../surface/workspaceView';
import { createEmbedWorkspaceHost } from './embedHost';
import type { EmbedWorkspaceController } from './embedHost';

type EmbedSession = {
  ctrl: EmbedWorkspaceController;
  collapsed: Set<string>;
  mode: 'tree' | 'raw';
  lastSynced: string;
  syncTimer: ReturnType<typeof setTimeout> | null;
};

/** Survive CE widget remounts; keyed per parent editor instance. */
const sessionsByEditor = new WeakMap<EditorAPI, Map<string, EmbedSession>>();

function sessionsFor(editor: EditorAPI): Map<string, EmbedSession> {
  let map = sessionsByEditor.get(editor);
  if (!map) {
    map = new Map();
    sessionsByEditor.set(editor, map);
  }
  return map;
}

export type MountJsonEmbedOptions = {
  text: string;
  path: number[];
  editor: EditorAPI;
  onCommit: (text: string) => void;
  labels: { title: string; tree: string; raw: string };
};

/** Inline Tree/Raw — same `mountJsonWorkspace` as the JSON Editor app. */
export function mountJsonEmbed(
  host: HTMLElement,
  opts: MountJsonEmbedOptions,
  scope: DisposableScope
): void {
  host.className = 'ocm-atom ocm-json-embed';
  const key = opts.path.join('.');
  const sessions = sessionsFor(opts.editor);
  let session = sessions.get(key);
  if (!session) {
    session = {
      ctrl: createEmbedWorkspaceHost(opts.editor, opts.text),
      collapsed: new Set<string>(),
      mode: 'tree',
      lastSynced: opts.text,
      syncTimer: null,
    };
    sessions.set(key, session);
  } else if (opts.text !== session.lastSynced && opts.text !== session.ctrl.getText()) {
    // External attr change (undo / setHTML) — reseed SoT.
    session.ctrl.setText(opts.text);
    session.lastSynced = opts.text;
  }

  const sessionRef = session;
  let surface: JsonWorkspaceHandle | null = null;
  let shell: MountHandle | null = null;
  let modeBar: MountHandle | null = null;

  const scheduleCommit = (): void => {
    if (sessionRef.syncTimer) {
      clearTimeout(sessionRef.syncTimer);
    }
    sessionRef.syncTimer = setTimeout(() => {
      sessionRef.syncTimer = null;
      if (surface?.isRawDirty()) {
        return;
      }
      const next = sessionRef.ctrl.getText();
      if (next === sessionRef.lastSynced) {
        return;
      }
      sessionRef.lastSynced = next;
      opts.onCommit(next);
    }, 200);
  };

  const paintModeBar = (slot: HTMLElement): void => {
    const mode = surface?.getMode() ?? sessionRef.mode;
    const spec = h('div', { class: 'ocm-json-embed__modes' }, [
      h(
        'button',
        {
          class: `ocm-json-embed__mode${mode === 'tree' ? ' is-active' : ''}`,
          attrs: { type: 'button', title: opts.labels.tree, 'aria-pressed': mode === 'tree' },
          props: { innerHTML: listIcon },
          on: {
            click: (e) => {
              e.preventDefault();
              e.stopPropagation();
              surface?.setMode('tree');
              sessionRef.mode = 'tree';
              paintModeBar(slot);
            },
          },
        },
        null
      ),
      h(
        'button',
        {
          class: `ocm-json-embed__mode${mode === 'raw' ? ' is-active' : ''}`,
          attrs: { type: 'button', title: opts.labels.raw, 'aria-pressed': mode === 'raw' },
          props: { innerHTML: bracesIcon },
          on: {
            click: (e) => {
              e.preventDefault();
              e.stopPropagation();
              surface?.setMode('raw');
              sessionRef.mode = 'raw';
              paintModeBar(slot);
            },
          },
        },
        null
      ),
    ]);
    if (!modeBar) {
      modeBar = mount(slot, spec);
    } else {
      modeBar.update(spec);
    }
  };

  shell = mount(
    host,
    h(
      'div',
      {
        class: 'ocm-json-embed__card',
        attrs: { role: 'group', 'aria-label': opts.labels.title },
        on: {
          // Keep CE from stealing keys while editing JSON.
          keydown: (e) => e.stopPropagation(),
          mousedown: (e) => e.stopPropagation(),
        },
      },
      [
        h('div', { class: 'ocm-json-embed__header' }, [
          h('span', { class: 'ocm-json-embed__badge' }, 'JSON'),
          h('div', { ref: 'modes', class: 'ocm-json-embed__modes-slot' }),
        ]),
        h('div', {
          ref: 'body',
          class: 'ocm-json-embed__body',
        }),
      ]
    )
  );

  const body = shell.refs.body;
  const modesSlot = shell.refs.modes;
  if (!(body instanceof HTMLElement) || !(modesSlot instanceof HTMLElement)) {
    shell.destroy();
    return;
  }

  surface = mountJsonWorkspace(sessionRef.ctrl.host, body, {
    rawPane: true,
    collapsedPaths: sessionRef.collapsed,
    initialMode: sessionRef.mode,
    onModeChange: () => {
      sessionRef.mode = surface?.getMode() ?? sessionRef.mode;
      paintModeBar(modesSlot);
    },
  });
  paintModeBar(modesSlot);

  const offDoc = sessionRef.ctrl.host.on('docChanged', () => {
    scheduleCommit();
  });
  const offSel = sessionRef.ctrl.host.on('selectionChanged', () => {
    surface?.update(sessionRef.ctrl.host.getState());
  });

  scope.own(shell);
  scope.disposable(() => {
    offDoc();
    offSel();
    if (sessionRef.syncTimer) {
      clearTimeout(sessionRef.syncTimer);
      sessionRef.syncTimer = null;
      if (!surface?.isRawDirty()) {
        const next = sessionRef.ctrl.getText();
        if (next !== sessionRef.lastSynced) {
          sessionRef.lastSynced = next;
          opts.onCommit(next);
        }
      }
    }
    surface?.destroy();
    surface = null;
    modeBar?.destroy();
    modeBar = null;
  });
}

/** Drop cached embed sessions for an editor (tests). */
export function clearJsonEmbedSessions(editor: EditorAPI): void {
  const map = sessionsByEditor.get(editor);
  if (!map) {
    return;
  }
  for (const s of map.values()) {
    if (s.syncTimer) {
      clearTimeout(s.syncTimer);
    }
    s.ctrl.destroy();
  }
  map.clear();
  sessionsByEditor.delete(editor);
}
