/** Virtual document model types — own kernel, no editor-framework deps. */

export interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface DocNode {
  type: string;
  id?: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: Mark[];
  content?: DocNode[];
}

export interface Point {
  path: number[];
  offset: number;
}

export interface Selection {
  anchor: Point;
  focus: Point;
}

export interface JSONDoc {
  version: number;
  doc: DocNode;
  selection?: Selection;
}
