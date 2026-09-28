import {
  applyTransaction,
  collapsedAt,
  createHistory,
  createState,
  docFromJSON,
  docToJSON,
  runCommand,
} from '@on-codemerge/kernel';
import type {
  Command,
  DocNode,
  EditorState,
  JSONDoc,
  Mark,
  Selection,
  Transaction,
} from '@on-codemerge/kernel';
import type { EditorAPI } from '@on-codemerge/sdk';
import { jsonCommandMap } from '../commands/jsonCommands';
import { emptyEditorDoc, isJsonEditorDoc, parseText, serializeDoc } from '../io';
import type { JsonWorkspaceHost } from '../surface/workspaceView';

export type EmbedWorkspaceController = {
  host: JsonWorkspaceHost;
  getText(): string;
  setText(text: string): boolean;
  destroy(): void;
};

/**
 * Isolated JSON SoT + history for a CE `json_embed` atom.
 * Proxies `ui` / `t` / `notify` from the parent WYSIWYG editor so Tree menus work.
 */
export function createEmbedWorkspaceHost(
  parent: EditorAPI,
  initialText: string
): EmbedWorkspaceController {
  const seed = parseText(initialText.trim() || 'null');
  let state = createState(seed.ok ? seed.doc : emptyEditorDoc({ key: 'value' }));
  const history = createHistory({ schema: parent.schema });
  const commands = jsonCommandMap();
  const listeners = {
    docChanged: new Set<(s: EditorState) => void>(),
    selectionChanged: new Set<(s: EditorState) => void>(),
  };

  const emit = (event: 'docChanged' | 'selectionChanged'): void => {
    for (const cb of listeners[event]) {
      cb(state);
    }
  };

  const replaceState = (doc: DocNode): void => {
    if (!isJsonEditorDoc(doc)) {
      throw new TypeError('embed JSON document must be doc with a single json child');
    }
    state = createState(doc, collapsedAt([0], 0));
    history.clear();
    emit('docChanged');
    emit('selectionChanged');
  };

  const dispatch = (tr: Transaction): void => {
    const onlySelection = tr.ops.length > 0 && tr.ops.every((o) => o.type === 'set_selection');
    if (onlySelection) {
      state = applyTransaction(state, tr, parent.schema).state;
      emit('selectionChanged');
      return;
    }
    const probe = applyTransaction(state, tr, parent.schema).state;
    if (!isJsonEditorDoc(probe.doc)) {
      return;
    }
    state = history.apply(state, tr);
    emit('docChanged');
    emit('selectionChanged');
  };

  const runLocal = (command: Command): boolean => {
    const tr = runCommand(state, command);
    if (tr === null) {
      return false;
    }
    const before = state;
    dispatch(tr);
    return state.doc !== before.doc || state.selection !== before.selection;
  };

  const host: JsonWorkspaceHost = {
    host: parent.host,
    chrome: parent.chrome,
    schema: parent.schema,
    contentElement: () => null,
    getState: () => state,
    getJSON: () => docToJSON(state.doc),
    setJSON: (json: JSONDoc | DocNode) => {
      replaceState(docFromJSON(json));
    },
    replaceDocument: (json: JSONDoc | DocNode) => {
      replaceState(docFromJSON(json));
    },
    getHTML: () => '',
    setHTML: () => {},
    getPublishedHTML: () => '',
    getPublishedJS: () => null,
    getPublishedDocument: () => '',
    getMarkdown: () => '',
    setMarkdown: () => {},
    dispatch,
    setSelection: (selection: Selection) => {
      state = { ...state, selection };
      emit('selectionChanged');
    },
    getSelection: () => state.selection,
    getStoredMarks: (): Mark[] => [],
    setStoredMarks: () => {},
    getSoftDeleteMark: () => null,
    setSoftDeleteMark: () => {},
    run: runLocal,
    command: (name: string) => {
      const cmd = commands[name];
      if (cmd === undefined) {
        return false;
      }
      return runLocal(cmd);
    },
    undo: () => {
      if (!history.canUndo()) {
        return false;
      }
      state = history.undo(state);
      emit('docChanged');
      return true;
    },
    redo: () => {
      if (!history.canRedo()) {
        return false;
      }
      state = history.redo(state);
      emit('docChanged');
      return true;
    },
    on: (event: 'docChanged' | 'selectionChanged', cb: (s: EditorState) => void) => {
      listeners[event].add(cb);
      return () => {
        listeners[event].delete(cb);
      };
    },
    t: parent.t.bind(parent),
    tc: parent.tc.bind(parent),
    getLocale: parent.getLocale.bind(parent),
    setLocale: parent.setLocale.bind(parent),
    registerLocale: parent.registerLocale.bind(parent),
    registerLocaleLoader: parent.registerLocaleLoader.bind(parent),
    onLocaleChange: parent.onLocaleChange.bind(parent),
    listLocales: parent.listLocales.bind(parent),
    toolbar: parent.toolbar,
    ui: parent.ui,
    use: () => {},
    notify: parent.notify.bind(parent),
    listShortcuts: () => [],
  };

  return {
    host,
    getText: () => serializeDoc(state.doc),
    setText: (text: string) => {
      const result = parseText(text.trim() || 'null');
      if (!result.ok) {
        return false;
      }
      replaceState(result.doc);
      return true;
    },
    destroy: () => {
      listeners.docChanged.clear();
      listeners.selectionChanged.clear();
    },
  };
}
