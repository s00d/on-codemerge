export type NodeType =
  | 'root'
  | 'text'
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'list-item'
  | 'table'
  | 'table-row'
  | 'table-cell';

export interface DocumentNode {
  type: NodeType;
  content: string;
  children: DocumentNode[];
  attributes: Record<string, string>;
}
