import { createEmbedSessionStore, h, mount, Resizer } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle } from '@codemerge/sdk';

import { buildGridContextMenu } from '../chrome/gridContextMenu';
import { TableStore } from '../grid/TableStore';
import { tableGridView } from '../grid/view/gridView';
import { attrsFromGrid, normalizeTableGrid } from '../io/adapters';
import type { TableGridDoc } from '../io/adapters';

export const TABLE_ATOM_MIN_W = 240;
export const TABLE_ATOM_MIN_H = 160;
export const TABLE_ATOM_DEFAULT_H = 240;

type EmbedSession = {
  store: TableStore;
  lastSig: string;
};

/** Survive contenteditable widget remounts; keyed per parent editor. */
const sessionsByEditor = createEmbedSessionStore<EmbedSession>();

function sigOf(grid: TableGridDoc): string {
  return JSON.stringify(attrsFromGrid(grid));
}

function pxSize(value: unknown, fallback: number, min: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return Math.max(min, Math.round(n));
}

function applyAtomBox(host: HTMLElement, width: number, height: number, fillWidth: boolean): void {
  host.style.boxSizing = 'border-box';
  host.style.maxWidth = '100%';
  host.style.height = `${height}px`;
  host.style.minHeight = `${TABLE_ATOM_MIN_H}px`;
  host.style.minWidth = `${TABLE_ATOM_MIN_W}px`;
  host.style.display = 'flex';
  host.style.flexDirection = 'column';
  if (fillWidth) {
    host.style.width = '100%';
  } else {
    host.style.width = `${width}px`;
  }
}

export type MountTableGridWidgetOptions = {
  grid: TableGridDoc;
  path: number[];
  editor: EditorAPI;
  width?: unknown;
  height?: unknown;
  onCommit: (grid: TableGridDoc, box: { width: number; height: number }) => void;
  onResize: (box: { width: number; height: number }) => void;
};

/** Live sheet in a sized, scrollable, resizable prose atom. */
export function mountTableGridWidget(
  host: HTMLElement,
  opts: MountTableGridWidgetOptions,
  scope: DisposableScope
): void {
  host.className = 'ocm-atom ocm-table-atom';
  const fillWidth = !(typeof opts.width === 'number' && opts.width > 0);
  let boxW = pxSize(opts.width, host.clientWidth || 640, TABLE_ATOM_MIN_W);
  let boxH = pxSize(opts.height, TABLE_ATOM_DEFAULT_H, TABLE_ATOM_MIN_H);
  applyAtomBox(host, boxW, boxH, fillWidth);

  const key = opts.path.join('.');
  const sessions = sessionsByEditor.forEditor(opts.editor);
  let session = sessions.get(key);
  const incoming = normalizeTableGrid(opts.grid);
  const incomingSig = sigOf(incoming);
  if (!session) {
    session = {
      store: new TableStore(incoming, {
        onCommit: (doc) => {
          const live = sessions.get(key);
          if (!live) {
            return;
          }
          const next = sigOf(doc);
          if (next === live.lastSig) {
            return;
          }
          live.lastSig = next;
          opts.onCommit(doc, {
            width: Math.max(TABLE_ATOM_MIN_W, host.offsetWidth),
            height: Math.max(TABLE_ATOM_MIN_H, host.offsetHeight),
          });
        },
      }),
      lastSig: incomingSig,
    };
    sessions.set(key, session);
  } else if (incomingSig !== session.lastSig && incomingSig !== sigOf(session.store.getDoc())) {
    session.store.setDoc(incoming);
    session.lastSig = incomingSig;
  }
  const sessionRef = session;

  const handle: MountHandle = mount(
    host,
    h(
      'div',
      {
        class: 'ocm-table-atom__inner',
        style: {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        },
      },
      tableGridView(session.store, {
        onContextMenu: (ev) => {
          opts.editor.ui.menu.open(
            buildGridContextMenu(opts.editor, sessionRef.store),
            ev.clientX,
            ev.clientY
          );
        },
      })
    )
  );
  scope.disposable(() => {
    handle.destroy();
  });

  const resizer = scope.slot<Resizer>();
  const showResizer = (): void => {
    resizer.replace(
      new Resizer(host, {
        aspect: 'free',
        minWidth: TABLE_ATOM_MIN_W,
        minHeight: TABLE_ATOM_MIN_H,
        onBlur: () => {
          resizer.clear();
        },
        onResize: (width, height) => {
          applyAtomBox(host, width, height, false);
        },
        onResizeEnd: (width, height) => {
          boxW = width;
          boxH = height;
          applyAtomBox(host, width, height, false);
          opts.onResize({ width, height });
        },
      })
    );
  };
  scope.on(host, 'click', (ev) => {
    const t = ev.target;
    if (t instanceof Element && t.closest('.ocm-resize-handle, .ocm-resize-frame')) {
      return;
    }
    showResizer();
  });
}
