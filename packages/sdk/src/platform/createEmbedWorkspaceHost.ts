import {
  applyTransaction,
  collapsedAt,
  createHistory,
  createState,
  docFromJSON,
  docToJSON,
  runCommand,
} from '@codemerge/kernel';
import type {
  Command,
  DocNode,
  EditorState,
  JSONDoc,
  Mark,
  Selection,
  Transaction,
} from '@codemerge/kernel';
import type { EditorAPI } from '../types';

export type EmbedWorkspaceController = {
  host: EditorAPI;
  getText(): string;
  setText(text: string): boolean;
  destroy(): void;
};

export type EmbedWorkspaceHostOptions = {
  parent: EditorAPI;
  seed: DocNode;
  isValidDoc: (doc: DocNode) => boolean;
  serialize: (doc: DocNode) => string;
  parse: (text: string) => { ok: true; doc: DocNode } | { ok: false };
  invalidMessage: string;
  commands?: Record<string, Command>;
};

/** Isolated SoT + history for CE embed atoms (JSON / Markdown). */
export function createEmbedWorkspaceHost(
  opts: EmbedWorkspaceHostOptions
): EmbedWorkspaceController {
  const { parent, isValidDoc, serialize, parse, invalidMessage, commands } = opts;
  let state = createState(opts.seed);
  const history = createHistory({ schema: parent.schema });
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
    if (!isValidDoc(doc)) {
      throw new TypeError(invalidMessage);
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
    if (!isValidDoc(probe.doc)) {
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

  const host = {
    host: parent.host,
    chrome: parent.chrome,
    schema: parent.schema,
    contentElement: (): HTMLElement | null => null,
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
      const cmd = commands?.[name];
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
    on: (...args: Parameters<EditorAPI['on']>) => {
      const [event, cb] = args;
      if (event === 'docChanged' || event === 'selectionChanged') {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- EditorAPI.on overload
        const fn = cb as (s: EditorState) => void;
        listeners[event].add(fn);
        return () => {
          listeners[event].delete(fn);
        };
      }
      return () => {};
    },
    t: parent.t.bind(parent),
    tc: parent.tc.bind(parent),
    getLocale: parent.getLocale.bind(parent),
    setLocale: parent.setLocale.bind(parent),
    registerLocale: parent.registerLocale.bind(parent),
    registerLocaleOverlay: parent.registerLocaleOverlay.bind(parent),
    onLocaleChange: parent.onLocaleChange.bind(parent),
    listLocales: parent.listLocales.bind(parent),
    toolbar: parent.toolbar,
    ui: parent.ui,
    use: () => {},
    notify: parent.notify.bind(parent),
    listShortcuts: () => [],
  } satisfies EditorAPI & { replaceDocument: (json: JSONDoc | DocNode) => void };

  return {
    host,
    getText: () => serialize(state.doc),
    setText: (text: string) => {
      const result = parse(text);
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
