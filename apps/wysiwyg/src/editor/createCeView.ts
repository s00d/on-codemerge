import type { CreateView, ViewPort } from '@on-codemerge/editor';
import { EditorView } from '../view/EditorView';
import { InputBridge } from '../view/InputBridge';

/** CE ViewPort factory owned by `@on-codemerge/wysiwyg`. */
export const createCeView: CreateView = (editor): ViewPort => {
  const view = new EditorView(editor.host, editor.getState(), {}, editor.getWidgets());
  view.setEditorAccessor(() => editor.asAlive());
  const bridge = new InputBridge(
    view.content,
    () => editor.getState(),
    (tr) => {
      editor.dispatch(tr);
    },
    () => view.isProjecting,
    () => ({
      storedMarks: editor.getStoredMarks(),
      softDelete: editor.getSoftDeleteMark(),
    })
  );
  return {
    update(state) {
      view.update(state);
    },
    updateSelection(state) {
      view.updateSelection(state);
    },
    destroy() {
      bridge.destroy();
      view.destroy();
    },
    contentTarget() {
      return view.content;
    },
    contentElement() {
      return view.content;
    },
  };
};
