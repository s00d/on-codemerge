// Entry carries the side-effect stylesheet import; keep it (empty-css placeholder otherwise).
import './sourceEditor.scss';

export {
  mountSourceEditor,
  sourceContentHeight,
  sourceScrollPadBottom,
  sourceGutterWidthPx,
  type SourceEditorHandle,
  type SourceEditorOptions,
} from './mountSourceEditor';
