import { h, mount } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle } from '@codemerge/sdk';

import { mountMdWorkspace } from '../surface/workspaceView';
import type { MdWorkspaceHandle } from '../surface/workspaceView';
import { createEmbedWorkspaceHost } from './embedHost';
import type { EmbedWorkspaceController } from './embedHost';

type EmbedSession = {
  ctrl: EmbedWorkspaceController;
  lastSynced: string;
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

export type MountMdEmbedOptions = {
  text: string;
  path: number[];
  editor: EditorAPI;
  onCommit: (text: string) => void;
  labels: { title: string };
};

/**
 * Inline dual-pane with dirty draft — parent attrs only on Apply / blur / dispose flush.
 * Never live `updateAttrs` from CM debounce (CE remount thrash).
 */
export function mountMdEmbed(
  host: HTMLElement,
  opts: MountMdEmbedOptions,
  scope: DisposableScope
): void {
  host.className = 'ocm-atom ocm-md-embed';
  const key = opts.path.join('.');
  const sessions = sessionsFor(opts.editor);
  let session = sessions.get(key);
  if (!session) {
    session = {
      ctrl: createEmbedWorkspaceHost(opts.editor, opts.text),
      lastSynced: opts.text,
    };
    sessions.set(key, session);
  } else if (opts.text !== session.lastSynced && opts.text !== session.ctrl.getText()) {
    session.ctrl.setText(opts.text);
    session.lastSynced = opts.text;
  }

  const sessionRef = session;
  let surface: MdWorkspaceHandle | null = null;
  let shell: MountHandle | null = null;

  const flushIfDirty = (): void => {
    if (!surface?.isDirty()) {
      return;
    }
    surface.applyDraft();
  };

  shell = mount(
    host,
    h(
      'div',
      {
        class: 'ocm-md-embed__card',
        attrs: { role: 'group', 'aria-label': opts.labels.title },
        on: {
          keydown: (e) => e.stopPropagation(),
          mousedown: (e) => e.stopPropagation(),
          focusout: (e) => {
            const next = e.relatedTarget;
            if (next instanceof Node && host.contains(next)) {
              return;
            }
            flushIfDirty();
          },
        },
      },
      [
        h('div', { class: 'ocm-md-embed__header' }, [
          h('span', { class: 'ocm-md-embed__badge' }, 'Markdown'),
        ]),
        h('div', {
          ref: 'body',
          class: 'ocm-md-embed__body',
        }),
      ]
    )
  );

  const body = shell.refs.body;
  if (!(body instanceof HTMLElement)) {
    shell.destroy();
    return;
  }

  surface = mountMdWorkspace(sessionRef.ctrl.host, body, {
    dirtyDraft: true,
    onApply: () => {
      const committed = sessionRef.ctrl.getText();
      if (committed !== sessionRef.lastSynced) {
        sessionRef.lastSynced = committed;
        opts.onCommit(committed);
      }
    },
  });

  scope.own(shell);
  scope.disposable(() => {
    flushIfDirty();
    surface?.destroy();
    surface = null;
  });
}
