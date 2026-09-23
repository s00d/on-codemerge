export type { DocNode, Mark, Point, Selection, JSONDoc } from './types';
export {
  createDoc,
  createText,
  createParagraph,
  cloneNode,
  deepCloneNode,
  docToJSON,
  docFromJSON,
  JSON_DOC_VERSION,
  copyAttrs,
  getNodeAt,
  replaceAt,
  textLength,
  resetIdCounter,
  nextId,
} from './document';
export {
  createSelection,
  collapsedAt,
  isCollapsed,
  clampSelection,
  comparePoints,
  orderedRange,
} from './selection';
export {
  applyOp,
  applyOps,
  selectionTextRange,
  mergeMarksByType,
  rangeHasMark,
  offsetHasMark,
  MAX_INSERT_CHARS,
  MAX_SLICE_KEEPS,
  MAX_TREE_DEPTH,
  assertMaxTreeDepth,
  type Operation,
} from './operations';
export { normalize, isNormalizeIdempotent } from './normalize';
export {
  createState,
  applyTransaction,
  transaction,
  type EditorState,
  type Transaction,
} from './transaction';
export {
  createSchema,
  registerNode,
  registerMark,
  sealSchema,
  assertMark,
  assertNodeType,
  type Schema,
  type NodeSpec,
  type MarkSpec,
} from './schema';
export { createHistory, emptyState, type HistoryController, type HistoryOptions } from './history';
export {
  insertText,
  deleteBackward,
  deleteForward,
  softDeleteBackward,
  splitBlock,
  toggleMark,
  selectionHasMark,
  selectAll,
  runCommand,
  deleteSelectionRangeOps,
  type Command,
} from './commands';
export {
  isTextBlock,
  isListType,
  plainText,
  resolveTextPath,
  createListItem,
  createList,
  liftIntoParent,
  exitListItemOps,
  textBlockLength,
} from './structure';
